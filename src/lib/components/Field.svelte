<script lang="ts">
  import type { Snippet } from "svelte";
  interface Props {
    label: string;
    req?: boolean;
    children: Snippet;
  }
  let { label, req = false, children }: Props = $props();
</script>

<div class="field">
  <div class="head">
    <span class="lbl">{label}</span>
    {#if req}
      <span class="req">●</span>
    {/if}
  </div>
  {@render children()}
</div>

<style>
  .field {
    margin-bottom: 13px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 6px;
  }
  .lbl {
    font-size: 11px;
    font-weight: 600;
    color: #999;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }
  .req {
    font-size: 7px;
    color: var(--red);
  }
</style>
