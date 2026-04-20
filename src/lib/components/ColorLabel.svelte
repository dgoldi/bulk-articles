<script lang="ts">
  import { COLOR_MAP, type ColorName } from "$lib/data/constants";

  interface Props {
    color: string;
  }
  let { color }: Props = $props();
</script>

<span class="color-label">
  <span
    class="swatch"
    style:background={COLOR_MAP[color as ColorName] ?? "#ccc"}
  ></span>
  {color}
</span>

<style>
  .color-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-family: var(--mono);
    color: var(--muted);
  }
  .swatch {
    width: 9px;
    height: 9px;
    border-radius: 3px;
    border: 1px solid #ddd;
    flex-shrink: 0;
  }
</style>
