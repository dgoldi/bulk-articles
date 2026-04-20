<script lang="ts">
  import { PRICES } from "$lib/data/constants";

  interface Props {
    value: number;
    onPick: (v: number) => void;
    fullBleed?: boolean;
  }
  let { value, onPick, fullBleed = false }: Props = $props();
</script>

<div class="wrap" class:full={fullBleed}>
  {#each PRICES as p (p)}
    <button
      type="button"
      class="ch btn"
      class:active={value === p}
      class:full={fullBleed}
      onclick={() => onPick(p)}
    >
      {p.toFixed(2)}
    </button>
  {/each}
</div>

<style>
  .wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .wrap.full {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    flex: 1;
    align-content: center;
  }
  .btn {
    padding: 5px 9px;
    border-radius: 6px;
    font-size: 11px;
    font-family: var(--mono);
    background: var(--chip-bg);
    color: #333;
    border: 1px solid var(--border);
  }
  .btn.full {
    padding: 16px 8px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
  }
  .btn.active {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }
</style>
