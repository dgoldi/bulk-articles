<script lang="ts">
  import { goto } from "$app/navigation";
  import { untrack } from "svelte";
  import type { Item } from "$lib/types/bulk-intake";
  import { batch } from "$lib/state/bulk-intake.svelte";
  import { handlePhotoFile } from "$lib/utils/photo-upload";
  import Field from "./Field.svelte";
  import SizePicker from "./SizePicker.svelte";
  import ColorPicker from "./ColorPicker.svelte";
  import PricePicker from "./PricePicker.svelte";
  import PriceStepper from "./PriceStepper.svelte";
  import CustomPriceBtn from "./CustomPriceBtn.svelte";

  interface Props {
    item: Item;
  }
  let { item }: Props = $props();

  let draft = $state<Item>(untrack(() => ({ ...item })));
  let fileInput: HTMLInputElement | undefined = $state.raw();
  let busy = $state(false);

  function save(): void {
    if (!draft.name.trim()) return;
    batch.updateItem(item.id, { ...draft, name: draft.name.trim() });
    goto("/items");
  }
  function del(): void {
    batch.removeItem(item.id);
    goto("/items");
  }
  function pickPhoto(): void {
    fileInput?.click();
  }
  function removePhoto(): void {
    draft.photo = null;
  }
  async function handleFile(e: Event): Promise<void> {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file || busy) return;
    busy = true;
    const dataUrl = await handlePhotoFile(file);
    busy = false;
    if (dataUrl) draft.photo = dataUrl;
  }
</script>

<div class="pad">
  <div class="photo-wrap">
    {#if draft.photo}
      <img class="photo" src={draft.photo} alt={draft.name} />
      <div class="photo-actions">
        <button
          type="button"
          class="ab photo-change"
          onclick={pickPhoto}
          disabled={busy}
        >
          {busy ? "Verarbeite …" : "Change photo"}
        </button>
        <button
          type="button"
          class="ab photo-remove"
          onclick={removePhoto}
          disabled={busy}
        >
          Remove
        </button>
      </div>
    {:else}
      <button
        type="button"
        class="ab photo-add"
        onclick={pickPhoto}
        disabled={busy}
      >
        <span class="photo-add-icon">📸</span>
        <span>{busy ? "Verarbeite …" : "Add photo"}</span>
      </button>
    {/if}
    <input
      bind:this={fileInput}
      class="hidden"
      type="file"
      accept="image/*"
      capture="environment"
      onchange={handleFile}
    />
  </div>

  <Field label="Name">
    <input type="text" class="input" bind:value={draft.name} />
  </Field>

  <Field label="Size">
    <SizePicker
      value={draft.size}
      onPick={(s) => (draft.size = s === draft.size ? "" : s)}
    />
  </Field>

  <Field label="Color">
    <ColorPicker
      value={draft.color}
      onPick={(c) => (draft.color = c === draft.color ? "" : c)}
    />
  </Field>

  <Field label="Price">
    <PriceStepper bind:price={draft.price} />
    <div class="price-picker">
      <PricePicker value={draft.price} onPick={(v) => (draft.price = v)} />
      <CustomPriceBtn price={draft.price} onSet={(v) => (draft.price = v)} inline />
    </div>
  </Field>

  <div class="actions">
    <button type="button" class="ab del" onclick={del}>Delete</button>
    <button
      type="button"
      class="ab save"
      disabled={!draft.name.trim()}
      onclick={save}
    >
      Save
    </button>
  </div>
</div>

<style>
  .pad {
    padding: 16px 18px;
  }
  .photo-wrap {
    margin-bottom: 16px;
  }
  .photo {
    width: 100%;
    max-height: 220px;
    object-fit: cover;
    border-radius: 12px;
  }
  .photo-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .photo-change {
    flex: 1;
    padding: 10px;
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-weight: 600;
    font-size: 13px;
  }
  .photo-remove {
    flex: 1;
    padding: 10px;
    background: #fff;
    border: 1px solid var(--red-border);
    border-radius: 8px;
    color: var(--red);
    font-weight: 600;
    font-size: 13px;
  }
  .photo-add {
    width: 100%;
    padding: 14px;
    background: var(--bg-alt);
    border: 2px dashed var(--border);
    border-radius: 12px;
    color: var(--muted);
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .photo-add-icon {
    font-size: 20px;
  }
  .photo-change:disabled,
  .photo-remove:disabled,
  .photo-add:disabled {
    opacity: 0.55;
    cursor: default;
  }
  .hidden {
    display: none;
  }
  .input {
    width: 100%;
    padding: 10px 12px;
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 14px;
    outline: none;
  }
  .price-picker {
    margin-top: 8px;
  }
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }
  .del {
    flex: 1;
    padding: 13px;
    background: #fff;
    border: 1px solid var(--red-border);
    border-radius: 8px;
    color: var(--red);
    font-weight: 600;
    font-size: 13px;
  }
  .save {
    flex: 1;
    padding: 13px;
    background: var(--accent);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
  }
  .save:disabled {
    opacity: 0.35;
    cursor: default;
  }
</style>
