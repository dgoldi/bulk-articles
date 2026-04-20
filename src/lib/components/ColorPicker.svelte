<script lang="ts">
  import { COLORS } from "$lib/data/constants";

  interface Props {
    value: string;
    onPick: (v: string) => void;
    fullBleed?: boolean;
  }
  let { value, onPick, fullBleed = false }: Props = $props();
</script>

<div class="wrap" class:full={fullBleed}>
  {#each COLORS as c (c.name)}
    <button
      type="button"
      class="ch cell"
      class:active={value === c.name}
      class:full={fullBleed}
      onclick={() => onPick(c.name)}
    >
      <div class="swatch" class:full={fullBleed} style:background={c.hex}></div>
      <span class="name" class:full={fullBleed} class:active={value === c.name}>
        {c.name}
      </span>
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
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    flex: 1;
    align-content: center;
  }
  .cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 10px 4px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--bg-alt);
  }
  .cell.active {
    border-color: var(--accent);
    background: #f0f0f0;
  }
  .swatch {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    border: 1.5px solid #ddd;
  }
  .swatch.full {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }
  .name {
    font-size: 9px;
    color: #555;
    font-weight: 500;
    margin-top: 3px;
  }
  .name.full {
    font-size: 11px;
  }
  .name.active {
    color: var(--accent);
    font-weight: 700;
  }
</style>
