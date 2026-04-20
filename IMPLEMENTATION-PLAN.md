# Implementation Plan — Bulk-Intake Flow → SvelteKit SPA

## Context

Port the React mobile-style bulk-intake flow at `bulk-intake-flow (2).jsx` (650 lines, single-file React with `useState` driving 4 wizard views) to a new SvelteKit SPA following the architecture in `sveltekit-spa-architecture.md`. The project directory is empty — no scaffold yet.

**Hard constraint**: a single root JSON object captures the full process state (template, items, in-progress draft, published flag) and is auto-persisted to `localStorage`, so any browser reload restores the user to exactly where they left off — including mid-add with a partial draft and the same active pill highlighted.

**Confirmed design decisions**:

- **Item shape**: flat custom (no Schema.org `Offer`/`Product` wrapping) — the architecture's JSON-LD pattern exists for PDF embedding, not relevant here.
- **Routing**: file-based per-step routes — URLs are the navigation cursor; the JSON is the data store. Together they realize "1 JSON syncs the whole process" (data) plus bookmarkable steps (navigation).
- **Photos**: compressed DataURL stored on each item — uses `browser-image-compression` per architecture §4e.

---

## 1. Scaffold

```
npm install         # after package.json is in place
```

Files created manually (all config is written, not scaffolded via `npm create`, for determinism):

- `package.json` — deps + `"engines": { "node": "24" }`
- `.npmrc` — `engine-strict=true`
- `svelte.config.js` — `adapter-auto` + `vitePreprocess()` (architecture lines 42–53)
- `vite.config.ts` — `sveltekit()` plugin only (lines 70–77)
- `tsconfig.json` — `strict`, `allowJs`, `checkJs`, `moduleDetection:"force"` (lines 83–93)
- `src/app.html` — `lang="en"`, DM Sans + DM Mono Google Fonts link, `viewport` with `maximum-scale=1`
- `src/app.d.ts` — SvelteKit ambient types
- `src/routes/+layout.ts` — `export const ssr = false; export const prerender = false;`

---

## 2. Type system — `src/lib/types/bulk-intake.ts`

Zod schemas as source of truth, types via `z.infer` (architecture §3).

```ts
export const ItemSchema = z.object({
  id: z.string(),                                  // crypto.randomUUID()
  name: z.string(),
  size: z.string(),
  color: z.string(),
  price: z.number().nonnegative(),
  photo: z.string().nullable(),                    // DataURL or null
  brand: z.string(),
  category: z.string(),
});

export const TemplateSchema = z.object({
  brand: z.string(),
  category: z.string(),
  photosOn: z.boolean(),
  autoName: z.boolean(),
  autoNamePrefix: z.string(),
});

export const DraftSchema = z.object({
  name: z.string(),
  size: z.string(),
  color: z.string(),
  price: z.number().nonnegative(),
  photo: z.string().nullable(),
  active: z.enum(["name","size","color","price","photo","done"]),
  addedCount: z.number().int().nonnegative(),
});

export const BulkIntakeStateSchema = z.object({
  "@type": z.literal("BulkIntakeBatch"),
  schemaVersion: z.number().int().positive(),
  template: TemplateSchema,
  items: z.array(ItemSchema),
  draft: DraftSchema,
  published: z.boolean(),
});

// Strict gate (architecture §3b) — used before publish
export const StrictItemSchema = ItemSchema.extend({
  name: z.string().trim().min(1),
});
export const StrictBulkIntakeSchema = BulkIntakeStateSchema.extend({
  template: TemplateSchema.extend({
    brand: z.string().min(1),
    category: z.string().min(1),
  }),
  items: z.array(StrictItemSchema).min(1),
});
```

No `view` or `editId` field — URL is the navigation source of truth (route params provide `editId`).

---

## 3. State module — `src/lib/state/bulk-intake.svelte.ts`

Pattern from architecture §2a:

```ts
export const state = $state<BulkIntakeState>(loadSaved() ?? structuredClone(seed));

$effect.root(() => {
  $effect(() => {
    localStorage.setItem("bulk-intake", JSON.stringify(state));
  });
});

const total = $derived(state.items.reduce((s, i) => s + i.price, 0));
const ok = $derived(!!state.template.brand && !!state.template.category);
export function getTotal() { return total; }
export function getOk() { return ok; }
export function getItemById(id: string) { return state.items.find(i => i.id === id); }

// Mutations (mirror React `actions` lines 30–38)
export function setTemplateField<K extends keyof Template>(field: K, value: Template[K]): void;
export function addItem(it: Omit<Item, "id">): void;
export function updateItem(id: string, data: Partial<Item>): void;
export function removeItem(id: string): void;
export function publish(): boolean;                // validates; returns success
export function reset(): void;                     // wipes to seed

// Draft
export function resetDraft(): void;                // honors template.autoName
export function setDraftField<K extends keyof Draft>(field: K, value: Draft[K]): void;
export function advanceDraft(from: Draft["active"]): void;
export function tapDraftPill(key: Exclude<Draft["active"],"done">): void;
export function commitDraftAndContinue(): void;
export function commitDraftAndFinish(): void;
```

**Migrations** — `src/lib/utils/migrations.ts` per architecture §4b. `CURRENT_SCHEMA_VERSION = 1`, empty registry initially.

**Seed** — `src/lib/data/bulk-intake-seed.ts` exports the empty initial state.

---

## 4. Constants — `src/lib/data/constants.ts`

Single file holding `BRANDS`, `CATEGORIES`, `SIZES`, `COLORS`, `COLOR_MAP`, `BRAND_TIER`, `TIER_LBL`, `PRICES`, `DARK_COLORS` from JSX lines 4–16. Use `as const` for tuple types.

---

## 5. Routing — file-based per step

```
src/routes/
  +layout.ts                       SPA: ssr=false, prerender=false
  +layout.svelte                   Shell: app.css, NavBar, {@render children()}
                                   Guard: if state.published && route ∉ {/published,/} → goto('/published')
  +page.svelte                     Redirect based on state
  setup/+page.svelte               <Setup />
  items/+page.svelte               <ItemList />
  items/add/+page.svelte           <AddItem />
  items/edit/[id]/+page.svelte     <EditItem />
  published/+page.svelte           <Done />
```

---

## 6. Components — `src/lib/components/`

1:1 port from JSX, all using Svelte 5 runes:

| File | Encapsulates |
|---|---|
| `NavBar.svelte` | Top app bar (back, title, fwd) |
| `Setup.svelte` | Brand/category chips, toggles, prefix input |
| `ItemList.svelte` | Stats row + cards + add button |
| `AddItem.svelte` | Pill rail + active field panel + commit buttons |
| `EditItem.svelte` | Edit form |
| `Done.svelte` | Published confirmation |
| `SizePicker.svelte` | Size grid |
| `ColorPicker.svelte` | Color grid |
| `PricePicker.svelte` | Price grid |
| `PriceStepper.svelte` | −5 / +5 |
| `CustomPriceBtn.svelte` | Opens Numpad |
| `Numpad.svelte` | Bottom-sheet keypad overlay |
| `PhotoCapture.svelte` | File input + compressImage |
| `Field.svelte` | Label + children |
| `FieldPanel.svelte` | Title/action header + children |
| `PillButton.svelte` | One pill in rail |
| `Toggle.svelte` | iOS-style switch |
| `Chips.svelte` | Chip selector |
| `Pill.svelte` | Generic pill atom |
| `ColorLabel.svelte` | Swatch + name |
| `StatBox.svelte` | Stats cell |
| `Toast.svelte` | Quota warning toast |

---

## 7. Utilities — `src/lib/utils/`

- `migrations.ts` — schema versioning + `parseExternalState` (§4b)
- `image.ts` — `compressImage(file): Promise<string>` per architecture §4e
- `id.ts` — `newId() → crypto.randomUUID()`

---

## 8. Styling

`src/app.css` (globals): DM Sans + DM Mono font import, reset, scrollbar/input rules, keyframes `fadeUp`/`pop`/`slideUp`, utility classes `.ch`/`.ab`/`.fi`/`.pop` (JSX lines 547–562), CSS custom properties for palette.

Per-component scoped `<style>` blocks. Conditional styling via `class:done` / `class:active`.

**Layout container**: `+layout.svelte` wraps children in `.app-frame { max-width:430px; margin:0 auto; min-height:100vh; }`. `Numpad` overlay: `position:fixed; inset:0` full-viewport; inner sheet `max-width:430px; margin:0 auto`.

---

## 9. localStorage size note

DataURL photos add ~50–100KB each. localStorage has ~5MB per origin → safe up to ~50 photos. `addItem`/`updateItem` catch `QuotaExceededError` from the persistence `$effect` and surface a toast warning via `src/lib/state/toast.svelte.ts`.

---

## Verification

1. `npm run dev` → app loads at `/`, redirects to `/setup` (empty template).
2. **Setup**: pick brand "Zara" → tier badge "FAST FASHION" appears with `fadeUp`; pick category "Dress"; toggle auto-name on, prefix "Test". Hit forward → `/items`.
3. **Add 3 items**: tap "Add first item" → `/items/add`. Item 1: name pre-filled "Test #1", active = `size`; pick S → advances to color → Black → price → 29.90 → photo → review → "Add & next". Item 2: mid-flow hard-reload → returns to `/items/add`, pill "Size" green with "S", active is `color`, draft preserved. Continue and finish. Item 3: tap a done pill → it clears and re-activates.
4. **Edit**: from `/items`, tap Edit on item 2 → `/items/edit/<id>`; change price via stepper; Save → returns to `/items`.
5. **Publish**: top-right "Publish 3" → validates via `StrictBulkIntakeSchema`; on success, `state.published=true` and `goto('/published')`. Done view shows count + total. Reload → still on `/published`.
6. **Reset**: tap "New batch" → wiped to seed, `goto('/setup')`.
7. **Migration smoke**: delete `schemaVersion` from localStorage → reload → app stamps it as v1 and loads cleanly.
8. **Strict gate**: set `state.template.brand=""` then publish → blocked, error toast.
9. **Quota**: fill localStorage near 5MB then add photo'd item → caught, toast warns.
10. **Console**: zero errors; no `$derived` export warnings.
