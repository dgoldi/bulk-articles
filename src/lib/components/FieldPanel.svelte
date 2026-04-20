<script lang="ts">
  import type { Snippet } from "svelte";
  interface Props {
    title?: string;
    action?: Snippet;
    children: Snippet;
  }
  let { title, action, children }: Props = $props();
</script>

<div class="panel fi">
  {#if title || action}
    <div class="head">
      {#if title}
        <div class="title">{title}</div>
      {/if}
      {#if action}
        {@render action()}
      {/if}
    </div>
  {/if}
  {@render children()}
</div>

<style>
  .panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px 18px;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .title {
    font-size: 15px;
    font-weight: 700;
  }
</style>
