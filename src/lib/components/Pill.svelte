<script lang="ts">
  import type { Snippet } from "svelte";
  interface Props {
    bg?: string;
    color?: string;
    children: Snippet;
  }
  let { bg = "#f0f0f0", color = "#888", children }: Props = $props();
</script>

<span class="pill" style:--pill-bg={bg} style:--pill-color={color}>
  {@render children()}
</span>

<style>
  .pill {
    font-size: 10px;
    font-family: var(--mono);
    background: var(--pill-bg);
    color: var(--pill-color);
    padding: 2px 7px;
    border-radius: 4px;
    font-weight: 500;
  }
</style>
