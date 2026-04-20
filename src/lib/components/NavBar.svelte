<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { batch } from "$lib/state/bulk-intake.svelte";
  import { showToast } from "$lib/state/toast.svelte";
  import { exportBatchAsJson } from "$lib/utils/file-io";

  interface NavAction {
    label: string;
    go: () => void;
  }
  interface NavConfig {
    title: string;
    back?: NavAction;
    fwd?: NavAction;
  }

  const nav = $derived.by<NavConfig>(resolveNav);

  function resolveNav(): NavConfig {
    const p = page.url.pathname;

    if (batch.state.published || p.startsWith("/published")) {
      return { title: "Published" };
    }
    if (p === "/setup" || p === "/") {
      return {
        title: "Configure Template",
        fwd: batch.templateOk
          ? { label: "Items →", go: () => goto("/items") }
          : undefined,
      };
    }
    if (p.startsWith("/items/add")) {
      return {
        title: "Add item",
        back: { label: "Items", go: () => goto("/items") },
      };
    }
    if (p.startsWith("/items/edit")) {
      return {
        title: "Edit item",
        back: { label: "Items", go: () => goto("/items") },
      };
    }
    if (p.startsWith("/items")) {
      const n = batch.state.items.length;
      return {
        title: "Items",
        back: { label: "Configure", go: () => goto("/setup") },
        fwd: n > 0 ? { label: `Publish ${n}`, go: doPublish } : undefined,
      };
    }
    return { title: "" };
  }

  function doPublish(): void {
    const result = batch.publish();
    if (!result.ok) {
      showToast(result.errors[0] ?? "Veröffentlichen fehlgeschlagen");
      return;
    }
    try {
      exportBatchAsJson(batch.state);
    } catch (err) {
      console.warn("JSON export failed:", err);
      showToast("JSON-Export fehlgeschlagen.");
    }
    goto("/published");
  }
</script>

<div class="bar">
  <div class="side start">
    {#if nav.back}
      <button type="button" class="ch back" onclick={nav.back.go}>
        ← {nav.back.label}
      </button>
    {/if}
  </div>
  <span class="title">{nav.title}</span>
  <div class="side end">
    {#if nav.fwd}
      <button type="button" class="ch fwd" onclick={nav.fwd.go}>
        {nav.fwd.label}
      </button>
    {/if}
  </div>
</div>

<style>
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    border-bottom: 1px solid var(--border-soft);
    min-height: 44px;
  }
  .side {
    flex: 1;
    display: flex;
  }
  .side.end {
    justify-content: flex-end;
  }
  .title {
    font-size: 15px;
    font-weight: 700;
    text-align: center;
  }
  .back {
    background: none;
    border: none;
    color: var(--muted);
    font-size: 13px;
    font-weight: 500;
    padding: 0;
  }
  .fwd {
    background: var(--accent);
    border: none;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 8px;
  }
</style>
