<script lang="ts">
  interface Props {
    val: string;
    onKey: (k: string) => void;
    onClose: () => void;
  }
  let { val, onKey, onClose }: Props = $props();

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "✓"];
</script>

<div
  class="overlay"
  role="dialog"
  aria-modal="true"
  tabindex="-1"
  onclick={onClose}
  onkeydown={(e) => e.key === "Escape" && onClose()}
>
  <div class="sheet" onclick={(e) => e.stopPropagation()} role="presentation">
    <div class="top">
      <span class="hint">Enter price</span>
      <button type="button" class="ch close" onclick={onClose}>×</button>
    </div>
    <div class="disp">
      <span class="unit">CHF</span>
      <span class="num" class:empty={!val}>{val || "0.00"}</span>
    </div>
    <div class="grid">
      {#each keys as k (k)}
        <button
          type="button"
          class="ab key"
          class:ok={k === "✓"}
          class:dot={k === "."}
          onclick={() => onKey(k)}
        >
          {k}
        </button>
      {/each}
    </div>
    <button type="button" class="ab back" onclick={() => onKey("⌫")}>
      ⌫ Delete
    </button>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.2);
    z-index: 200;
    display: flex;
    align-items: flex-end;
  }
  .sheet {
    width: 100%;
    max-width: 430px;
    margin: 0 auto;
    background: #fff;
    border-radius: 16px 16px 0 0;
    padding: 16px 20px 30px;
    animation: slideUp 0.2s ease;
    box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.08);
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .hint {
    font-size: 13px;
    font-weight: 600;
    color: #999;
  }
  .close {
    background: none;
    border: none;
    font-size: 18px;
    color: #bbb;
  }
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
