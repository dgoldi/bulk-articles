<script lang="ts">
  import { goto } from "$app/navigation";
  import {
    BRANDS,
    CATEGORIES,
    BRAND_TIER,
    TIER_LBL,
    type BrandName,
  } from "$lib/data/constants";
  import { batch } from "$lib/state/bulk-intake.svelte";
  import Field from "./Field.svelte";
  import Chips from "./Chips.svelte";
  import Pill from "./Pill.svelte";
  import Toggle from "./Toggle.svelte";

  const tier = $derived(
    batch.state.template.brand
      ? (BRAND_TIER[batch.state.template.brand as BrandName] ?? 0)
      : 0,
  );
</script>

<div class="scroll">
  <div class="sub intro">Shared across all items in this batch</div>

  <Field label="Brand" req>
    <Chips
      items={BRANDS}
      value={batch.state.template.brand}
      onPick={(v) => batch.setTemplateField("brand", v)}
    />
    {#if batch.state.template.brand}
      <div class="fi tier">
        <Pill bg="var(--indigo-bg)" color="var(--indigo)">
          {TIER_LBL[tier]}
        </Pill>
      </div>
    {/if}
  </Field>

  <Field label="Category" req>
    <Chips
      items={CATEGORIES}
      value={batch.state.template.category}
      onPick={(v) => batch.setTemplateField("category", v)}
    />
  </Field>

  <Toggle
    label="Photos"
    sub="Capture per item"
    on={batch.state.template.photosOn}
    onToggle={() =>
      batch.setTemplateField("photosOn", !batch.state.template.photosOn)}
  />
  <Toggle
    label="Auto-name"
    sub="Pre-fill with increment"
    on={batch.state.template.autoName}
    onToggle={() =>
      batch.setTemplateField("autoName", !batch.state.template.autoName)}
  />

  {#if batch.state.template.autoName}
    <div class="fi prefix">
      <Field label="Name prefix">
        <input
          type="text"
          class="input"
          value={batch.state.template.autoNamePrefix}
          oninput={(e) =>
            batch.setTemplateField("autoNamePrefix", e.currentTarget.value)}
          placeholder={batch.state.template.category || "Item"}
        />
        <div class="sub preview">
          Preview:
          <b
            >{batch.state.template.autoNamePrefix ||
              batch.state.template.category ||
              "Item"} #1</b
          >,
          <b>…#2</b>
        </div>
      </Field>
    </div>
  {/if}

  <button
    type="button"
    class="ab go-btn"
    disabled={!batch.templateOk}
    onclick={() => goto("/items")}
  >
    Go to items →
  </button>
</div>

<style>
  .scroll {
    flex: 1;
    padding: 16px 18px;
    overflow-y: auto;
  }
  .sub {
    font-size: 11px;
    color: var(--sub);
    margin-top: 1px;
  }
  .intro {
    margin-bottom: 16px;
  }
  .tier {
    margin-top: 5px;
  }
  .prefix {
    margin-top: 8px;
  }
  .preview {
    margin-top: 4px;
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
  .go-btn {
    width: 100%;
    padding: 13px;
    background: var(--accent);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    text-align: center;
    margin-top: 16px;
  }
  .go-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }
</style>
