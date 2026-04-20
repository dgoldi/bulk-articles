<script lang="ts">
  interface Props {
    price: number;
    onSet: (v: number) => void;
  }
  let { price, onSet }: Props = $props();
</script>

<div class="row">
  <button
    type="button"
    class="ch tweak"
    onclick={() => onSet(Math.max(0, price - 5))}
  >
    −5
  </button>
  <span class="value">{price > 0 ? price.toFixed(2) : "—"}</span>
  <button type="button" class="ch tweak" onclick={() => onSet(price + 5)}>
    +5
  </button>
</div>

<style>
  .row {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
  }
  .tweak {
    width: 44px;
    height: 36px;
    border-radius: 8px;
    background: var(--chip-bg);
    border: 1px solid var(--border);
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
    font-family: var(--mono);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .value {
    font-family: var(--mono);
    font-size: 16px;
    font-weight: 700;
    min-width: 70px;
    text-align: center;
  }
</style>
