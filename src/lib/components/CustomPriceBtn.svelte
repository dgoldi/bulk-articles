<script lang="ts">
  import Numpad from "./Numpad.svelte";

  interface Props {
    price: number;
    onSet: (v: number) => void;
    inline?: boolean;
  }
  let { price, onSet, inline = false }: Props = $props();

  let open = $state(false);
  let val = $state("");

  function nk(k: string): void {
    if (k === "⌫") {
      val = val.slice(0, -1);
    } else if (k === ".") {
      if (!val.includes(".")) val = val + ".";
    } else if (k === "✓") {
      if (val) onSet(Number(val));
      open = false;
      val = "";
    } else if (val.length < 6) {
      val = val + k;
    }
  }

  function openPad(): void {
    val = price > 0 ? String(price) : "";
    open = true;
  }

  function close(): void {
    open = false;
    val = "";
  }
</script>

<button
  type="button"
  class="ch trigger"
  class:inline
  onclick={openPad}
>
  Custom ✎
</button>

{#if open}
  <Numpad {val} onKey={nk} onClose={close} />
{/if}

<style>
  .trigger {
    font-size: 11px;
    font-weight: 600;
    color: var(--indigo);
    background: var(--indigo-bg);
    border: 1px solid var(--indigo-border);
    border-radius: 6px;
    padding: 5px 12px;
  }
  .trigger.inline {
    padding: 5px 9px;
    margin-top: 4px;
  }
</style>
