import {
  StrictBulkIntakeSchema,
  type BulkIntakeState,
  type Draft,
  type DraftActive,
  type Item,
  type Template,
} from "../types/bulk-intake";
import { seedState, emptyDraft } from "../data/bulk-intake-seed";
import { parseExternalBulkIntake } from "../utils/migrations";
import { newId } from "../utils/id";
import { showToast } from "./toast.svelte";

const STORAGE_KEY = "bulk-intake";
const PERSIST_DEBOUNCE_MS = 250;
const DRAFT_ORDER: readonly DraftActive[] = [
  "name",
  "size",
  "color",
  "price",
  "photo",
];

export type PublishResult =
  | { ok: true }
  | { ok: false; errors: string[] };

type FieldKey = Exclude<DraftActive, "done">;

function loadSaved(): BulkIntakeState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return parseExternalBulkIntake(JSON.parse(raw));
  } catch (err) {
    console.warn("Failed to load saved bulk-intake state:", err);
    showToast("Gespeicherte Daten beschädigt – neue Session gestartet.");
    return null;
  }
}

class BulkIntakeStore {
  state = $state<BulkIntakeState>(loadSaved() ?? structuredClone(seedState));
  total = $derived(this.state.items.reduce((s, it) => s + it.price, 0));
  templateOk = $derived(
    !!this.state.template.brand && !!this.state.template.category,
  );

  constructor() {
    $effect.root(() => {
      let tid: ReturnType<typeof setTimeout> | undefined;
      $effect(() => {
        const snapshot = $state.snapshot(this.state);
        clearTimeout(tid);
        tid = setTimeout(() => {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
          } catch (err) {
            if (err instanceof DOMException && err.name === "QuotaExceededError") {
              showToast("Speicher voll – ältere Items oder Fotos entfernen.");
            } else {
              console.warn("Persistence failed:", err);
            }
          }
        }, PERSIST_DEBOUNCE_MS);
        return () => clearTimeout(tid);
      });
    });
  }

  getItemById(id: string): Item | undefined {
    return this.state.items.find((i) => i.id === id);
  }

  setTemplateField<K extends keyof Template>(field: K, value: Template[K]): void {
    if (this.state.template[field] === value) return;
    this.state.template[field] = value;
  }

  addItem(it: Omit<Item, "id">): Item {
    const item: Item = { ...it, id: newId() };
    this.state.items.push(item);
    return item;
  }

  updateItem(id: string, data: Partial<Item>): void {
    const idx = this.state.items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    this.state.items[idx] = { ...this.state.items[idx], ...data };
  }

  removeItem(id: string): void {
    const idx = this.state.items.findIndex((i) => i.id === id);
    if (idx >= 0) this.state.items.splice(idx, 1);
  }

  publish(): PublishResult {
    const result = StrictBulkIntakeSchema.safeParse(this.state);
    if (!result.success) {
      return { ok: false, errors: result.error.issues.map((i) => i.message) };
    }
    Object.assign(this.state.draft, emptyDraft);
    this.state.published = true;
    return { ok: true };
  }

  reset(): void {
    Object.assign(this.state, structuredClone(seedState));
  }

  // ── Draft ────────────────────────────────────────────────────────────────
  #autoNameFor(index: number): string {
    const t = this.state.template;
    const prefix = t.autoNamePrefix || t.category || "Item";
    return `${prefix} #${index + 1}`;
  }

  resetDraft(): void {
    const t = this.state.template;
    const next: Draft = {
      ...emptyDraft,
      name: t.autoName ? this.#autoNameFor(this.state.items.length) : "",
      active: t.autoName ? "size" : "name",
      addedCount: this.state.draft.addedCount,
    };
    Object.assign(this.state.draft, next);
  }

  initDraftIfEmpty(): void {
    const d = this.state.draft;
    const isEmpty =
      !d.name && !d.size && !d.color && d.price === 0 && d.photo === null;
    if (isEmpty) this.resetDraft();
  }

  setDraftField<K extends keyof Draft>(field: K, value: Draft[K]): void {
    if (this.state.draft[field] === value) return;
    this.state.draft[field] = value;
  }

  refreshAutoName(): void {
    const t = this.state.template;
    if (!t.autoName) return;
    const next = this.#autoNameFor(this.state.items.length);
    if (this.state.draft.name !== next) this.state.draft.name = next;
  }

  isFieldDone(key: FieldKey): boolean {
    const d = this.state.draft;
    switch (key) {
      case "name":
        return !!d.name.trim();
      case "size":
        return !!d.size;
      case "color":
        return !!d.color;
      case "price":
        return d.price > 0;
      case "photo":
        return !!d.photo;
      default: {
        const _exhaustive: never = key;
        return _exhaustive;
      }
    }
  }

  #availableFields(): readonly FieldKey[] {
    const t = this.state.template;
    return DRAFT_ORDER.filter(
      (k): k is FieldKey => k !== "photo" || t.photosOn,
    );
  }

  advanceDraft(from: DraftActive): void {
    const fields = this.#availableFields();
    const idx = fields.indexOf(from as FieldKey);
    const next = fields.slice(idx + 1).find((k) => !this.isFieldDone(k));
    this.state.draft.active = next ?? "done";
  }

  tapDraftPill(key: FieldKey): void {
    const d = this.state.draft;
    const t = this.state.template;
    if (this.isFieldDone(key)) {
      if (key === "name" && !t.autoName) d.name = "";
      else if (key === "size") d.size = "";
      else if (key === "color") d.color = "";
      else if (key === "price") d.price = 0;
      else if (key === "photo") d.photo = null;
    }
    d.active = key;
  }

  #buildItemFromDraft(): Omit<Item, "id"> {
    const d = this.state.draft;
    const t = this.state.template;
    return {
      name: d.name.trim(),
      size: d.size,
      color: d.color,
      price: d.price,
      photo: t.photosOn ? d.photo : null,
      brand: t.brand,
      category: t.category,
    };
  }

  commitDraftAndContinue(): boolean {
    if (!this.state.draft.name.trim()) return false;
    this.addItem(this.#buildItemFromDraft());
    this.state.draft.addedCount += 1;
    this.resetDraft();
    return true;
  }

  commitDraftAndFinish(): boolean {
    if (!this.state.draft.name.trim()) return false;
    this.addItem(this.#buildItemFromDraft());
    this.resetDraft();
    return true;
  }
}

export const batch = new BulkIntakeStore();
