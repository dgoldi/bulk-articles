<script lang="ts">
  import { toast } from "$lib/state/toast.svelte";
</script>

{#if toast.visible}
  <div class="toast">{toast.message}</div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--accent);
    color: #fff;
    padding: 10px 18px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
    max-width: 340px;
    text-align: center;
    z-index: 500;
    animation: fadeUp 0.18s ease forwards;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
</style>
