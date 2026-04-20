<script lang="ts">
  import { goto } from "$app/navigation";
  import type { DraftActive } from "$lib/types/bulk-intake";
  import { COLOR_MAP, type ColorName } from "$lib/data/constants";
  import { batch } from "$lib/state/bulk-intake.svelte";
  import PillButton from "./PillButton.svelte";
  import FieldPanel from "./FieldPanel.svelte";
  import SizePicker from "./SizePicker.svelte";
  import ColorPicker from "./ColorPicker.svelte";
  import PricePicker from "./PricePicker.svelte";
  import PriceStepper from "./PriceStepper.svelte";
  import CustomPriceBtn from "./CustomPriceBtn.svelte";
  import PhotoCapture from "./PhotoCapture.svelte";
  import Pill from "./Pill.svelte";
  import ColorLabel from "./ColorLabel.svelte";

  const FLASH_TO_ADVANCE_MS = 180;

  batch.initDraftIfEmpty();

  let nameInput: HTMLInputElement | undefined = $state.raw();

  $effect(() => {
    if (batch.state.template.autoName) batch.refreshAutoName();
  });

  $effect(() => {
    if (batch.state.draft.active === "name") nameInput?.focus();
  });

  type FieldKey = Exclude<DraftActive, "done">;
  interface FieldRow {
    key: FieldKey;
    label: string;
    done: boolean;
    val: string | null;
    hex?: string;
    thumb?: string | null;
  }

  const fields = $derived.by(buildFields);

  function buildFields(): FieldRow[] {
    const d = batch.state.draft;
    const rows: FieldRow[] = [
      {
        key: "name",
        label: "Name",
        done: batch.isFieldDone("name"),
        val: d.name.length > 12 ? d.name.slice(0, 10) + "…" : d.name || null,
      },
      {
        key: "size",
        label: "Size",
        done: batch.isFieldDone("size"),
        val: d.size || null,
      },
      {
        key: "color",
        label: "Color",
        done: batch.isFieldDone("color"),
        val: d.color || null,
        hex: d.color ? COLOR_MAP[d.color as ColorName] : undefined,
      },
      {
        key: "price",
        label: "Price",
        done: batch.isFieldDone("price"),
        val: d.price > 0 ? d.price.toFixed(2) : null,
      },
    ];
    if (batch.state.template.photosOn) {
      rows.push({
        key: "photo",
        label: "📸",
        done: batch.isFieldDone("photo"),
        val: null,
        thumb: d.photo,
      });
    }
    return rows;
  }

  function pickSize(s: string): void {
    batch.setDraftField("size", s);
    batch.advanceDraft("size");
  }
  function pickColor(c: string): void {
    batch.setDraftField("color", c);
    batch.advanceDraft("color");
  }
  function pickPrice(p: number): void {
    batch.setDraftField("price", p);
    batch.advanceDraft("price");
  }
  function capture(dataUrl: string): void {
    batch.setDraftField("photo", dataUrl);
    setTimeout(() => batch.advanceDraft("photo"), FLASH_TO_ADVANCE_MS);
  }
  function onNameEnter(e: KeyboardEvent): void {
    if (e.key === "Enter" && batch.state.draft.name.trim())
      batch.advanceDraft("name");
  }

  function addAndFinish(): void {
    if (batch.commitDraftAndFinish()) goto("/items");
  }
  function addAndContinue(): void {
    batch.commitDraftAndContinue();
  }
</script>

<div class="fill">
  <div class="rail">
    {#each fields as f (f.key)}
      <PillButton
        field={f}
        active={batch.state.draft.active === f.key}
        onTap={() => batch.tapDraftPill(f.key)}
      />
    {/each}
  </div>

  <div class="area">
    {#if batch.state.draft.active === "name"}
      <FieldPanel title="Item name">
        <input
          bind:this={nameInput}
          type="text"
          class="name-input"
          value={batch.state.draft.name}
          oninput={(e) => batch.setDraftField("name", e.currentTarget.value)}
          onkeydown={onNameEnter}
          placeholder="e.g. Floral Midi, Slim Fit..."
        />
        <div class="spacer"></div>
        {#if batch.state.draft.name.trim()}
          <button
            type="button"
            class="ab continue"
            onclick={() => batch.advanceDraft("name")}
          >
            Continue →
          </button>
        {/if}
      </FieldPanel>
    {:else if batch.state.draft.active === "size"}
      <FieldPanel title="Size">
        <SizePicker value={batch.state.draft.size} onPick={pickSize} fullBleed />
      </FieldPanel>
    {:else if batch.state.draft.active === "color"}
      <FieldPanel title="Color">
        <ColorPicker
          value={batch.state.draft.color}
          onPick={pickColor}
          fullBleed
        />
      </FieldPanel>
    {:else if batch.state.draft.active === "price"}
      <FieldPanel title="Price">
        {#snippet action()}
          <CustomPriceBtn
            price={batch.state.draft.price}
            onSet={(p) => {
              batch.setDraftField("price", p);
              batch.advanceDraft("price");
            }}
          />
        {/snippet}
        <PricePicker
          value={batch.state.draft.price}
          onPick={pickPrice}
          fullBleed
        />
        {#if batch.state.draft.price > 0}
          <div class="stepper">
            <PriceStepper bind:price={batch.state.draft.price} />
          </div>
        {/if}
      </FieldPanel>
    {:else if batch.state.draft.active === "photo"}
      <FieldPanel>
        <PhotoCapture onCapture={capture} />
      </FieldPanel>
    {:else if batch.state.draft.active === "done"}
      <FieldPanel title="Review">
        <div class="preview">
          {#if batch.state.draft.photo}
            <img
              class="preview-photo"
              src={batch.state.draft.photo}
              alt={batch.state.draft.name}
            />
          {/if}
          <div class="preview-name">{batch.state.draft.name}</div>
          <div class="preview-badges">
            {#if batch.state.draft.size}
              <Pill bg="var(--chip-bg)" color="#444"
                >{batch.state.draft.size}</Pill
              >
            {/if}
            {#if batch.state.draft.color}
              <ColorLabel color={batch.state.draft.color} />
            {/if}
            {#if batch.state.template.photosOn && batch.state.draft.photo}
              <Pill bg="var(--green-bg)" color="var(--green)">📸</Pill>
            {/if}
          </div>
          {#if batch.state.draft.price > 0}
            <div class="preview-price">
              CHF {batch.state.draft.price.toFixed(2)}
            </div>
          {/if}
        </div>
        <div class="spacer"></div>
        <div class="commit">
          <button
            type="button"
            class="ab finish"
            disabled={!batch.state.draft.name.trim()}
            onclick={addAndFinish}
          >
            Add & finish
          </button>
          <button
            type="button"
            class="ab next"
            disabled={!batch.state.draft.name.trim()}
            onclick={addAndContinue}
          >
            Add & next →
          </button>
        </div>
      </FieldPanel>
    {/if}
  </div>
</div>

<style>
  .fill {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .rail {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 10px 18px;
    border-bottom: 1px solid var(--border-soft);
    overflow-x: auto;
  }
  .area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .name-input {
    width: 100%;
    padding: 14px 16px;
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text);
    font-family: var(--sans);
    font-size: 16px;
    font-weight: 500;
    outline: none;
  }
  .spacer {
    flex: 1;
  }
  .continue {
    width: 100%;
    padding: 13px;
    background: var(--accent);
    border: none;
    border-radius: 10px;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    text-align: center;
    margin-bottom: 8px;
  }
  .stepper {
    margin-top: 12px;
  }
  .preview {
    width: 100%;
    padding: 18px;
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 14px;
  }
  .preview-photo {
    width: 100%;
    max-height: 180px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 10px;
  }
  .preview-name {
    font-weight: 700;
    font-size: 16px;
    margin-bottom: 8px;
  }
  .preview-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }
  .preview-price {
    font-family: var(--mono);
    font-size: 20px;
    font-weight: 700;
  }
  .commit {
    display: flex;
    gap: 8px;
  }
  .finish {
    flex: 1;
    padding: 13px;
    background: var(--accent);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
  }
  .next {
    flex: 2;
    padding: 16px;
    background: var(--green);
    border: none;
    border-radius: 12px;
    color: #fff;
    font-weight: 800;
    font-size: 15px;
  }
  .finish:disabled,
  .next:disabled {
    opacity: 0.35;
    cursor: default;
  }
</style>
