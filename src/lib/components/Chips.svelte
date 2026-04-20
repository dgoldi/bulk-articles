<script lang="ts">
  interface Props {
    items: readonly string[];
    value: string;
    onPick: (v: string) => void;
  }
  let { items, value, onPick }: Props = $props();
</script>

<div class="wrap">
  {#each items as v (v)}
    <button
      type="button"
      class="ch chip"
      class:active={value === v}
      onclick={() => onPick(v)}
    >
      {v}
    </button>
  {/each}
</div>

<style>
  .wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .chip {
    font-size: 11px;
    font-family: var(--sans);
    padding: 5px 10px;
    border-radius: 6px;
    background: var(--chip-bg);
    color: #666;
    border: none;
    font-weight: 400;
    transition: all 0.15s;
  }
  .chip.active {
    background: var(--accent);
    color: #fff;
    font-weight: 600;
  }
</style>
