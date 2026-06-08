<script lang="ts">
  import { untrack } from "svelte";

  interface Props {
    value: number;
    currency: string;
    onInput: (v: number) => void;
    onConfirm?: () => void;
  }
  let { value, currency, onInput, onConfirm }: Props = $props();

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "✓"];

  // Seed once from the initial value; external changes are handled by the effect below.
  let buf = $state(untrack(() => (value > 0 ? String(value) : "")));

  // Resync the typing buffer when `value` changes externally (e.g. PriceStepper ±5).
  // untrack keeps this effect dependent on `value` only, never on `buf` it writes.
  $effect(() => {
    const v = value;
    untrack(() => {
      if (Number(buf) !== v) buf = v > 0 ? String(v) : "";
    });
  });

  function press(k: string): void {
    if (k === "✓") {
      onConfirm?.();
      return;
    }
    if (k === "⌫") {
      buf = buf.slice(0, -1);
    } else if (k === ".") {
      if (!buf.includes(".")) buf = buf + ".";
    } else if (buf.length < 6) {
      buf = buf + k;
    }
    onInput(Number(buf) || 0);
  }
</script>

<div class="pad">
  <div class="disp">
    <span class="unit">{currency}</span>
    <span class="num" class:empty={!buf}>{buf || "0.00"}</span>
  </div>
  <div class="grid">
    {#each keys as k (k)}
      <button
        type="button"
        class="ab key"
        class:ok={k === "✓"}
        class:dot={k === "."}
        onclick={() => press(k)}
      >
        {k}
      </button>
    {/each}
  </div>
  <button type="button" class="ab back" onclick={() => press("⌫")}>
    ⌫ Delete
  </button>
</div>

<style>
  .disp {
    display: flex;
    align-items: baseline;
    justify-content: flex-end;
    gap: 8px;
    padding: 8px 0 14px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 12px;
  }
  .unit {
    color: var(--sub);
    font-family: var(--mono);
    font-size: 14px;
  }
  .num {
    font-size: 40px;
    font-weight: 800;
    color: #111;
    min-width: 80px;
    text-align: right;
  }
  .num.empty {
    color: #ccc;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .key {
    padding: 14px;
    border-radius: 10px;
    font-family: var(--sans);
    font-weight: 700;
    font-size: 22px;
    background: #f8f8f8;
    color: #111;
    border: 1px solid var(--border);
  }
  .key.dot {
    font-size: 28px;
    color: var(--muted);
  }
  .key.ok {
    background: var(--accent);
    color: #fff;
    border: none;
    font-size: 18px;
  }
  .back {
    width: 100%;
    margin-top: 8px;
    padding: 11px;
    background: var(--chip-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
    text-align: center;
  }
</style>
