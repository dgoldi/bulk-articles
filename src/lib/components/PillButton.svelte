<script lang="ts">
  import type { DraftActive } from "$lib/types/bulk-intake";

  interface Field {
    key: Exclude<DraftActive, "done">;
    label: string;
    done: boolean;
    val: string | null;
    hex?: string;
    thumb?: string | null;
  }
  interface Props {
    field: Field;
    active: boolean;
    onTap: () => void;
  }
  let { field: f, active, onTap }: Props = $props();
</script>

<button
  type="button"
  class="ch pill"
  class:done={f.done}
  class:active={active && !f.done}
  class:has-thumb={f.done && !!f.thumb}
  onclick={onTap}
>
  {#if f.done && f.thumb}
    <img class="thumb" src={f.thumb} alt="" />
  {:else}
    {#if f.hex && f.done}
      <span class="swatch" style:background={f.hex}></span>
    {/if}
    <span class="label">{f.done && f.val ? f.val : f.label}</span>
  {/if}
</button>

<style>
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    border-radius: 20px;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all 0.15s;
    background: var(--chip-bg);
    border: 1.5px solid var(--border);
    color: #bbb;
    font-weight: 400;
  }
  .pill.done {
    background: var(--green-bg);
    border-color: var(--green-border);
    color: var(--green);
    font-weight: 600;
  }
  .pill.active {
    background: #fff;
    border-color: var(--accent);
    color: var(--accent);
    font-weight: 600;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }
  .swatch {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    border: 1px solid #ccc;
    flex-shrink: 0;
  }
  .label {
    font-size: 10px;
  }
  .pill.has-thumb {
    padding: 2px 4px 2px 2px;
  }
  .thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
  }
</style>
