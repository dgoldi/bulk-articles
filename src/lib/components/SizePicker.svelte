<script lang="ts">
  import { SIZES } from "$lib/data/constants";

  interface Props {
    value: string;
    onPick: (v: string) => void;
    fullBleed?: boolean;
  }
  let { value, onPick, fullBleed = false }: Props = $props();
</script>

<div class="wrap" class:full={fullBleed}>
  {#each SIZES as s (s)}
    <button
      type="button"
      class="ch btn"
      class:active={value === s}
      class:full={fullBleed}
      onclick={() => onPick(s)}
    >
      {s}
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
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    flex: 1;
    align-content: center;
  }
  .btn {
    font-family: var(--mono);
    background: var(--chip-bg);
    color: #444;
    border: 1px solid var(--border);
    padding: 4px 7px;
    border-radius: 5px;
    font-size: 10px;
    min-width: 28px;
    text-align: center;
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
