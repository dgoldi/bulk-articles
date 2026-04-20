<script lang="ts">
  import "../app.css";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { batch } from "$lib/state/bulk-intake.svelte";
  import NavBar from "$lib/components/NavBar.svelte";
  import Toast from "$lib/components/Toast.svelte";

  let { children } = $props();

  $effect(() => {
    const p = page.url.pathname;
    const published = batch.state.published;
    const ok = batch.templateOk;

    if (published && p !== "/published") {
      goto("/published", { replaceState: true });
      return;
    }
    if (!published && p === "/published") {
      goto("/", { replaceState: true });
      return;
    }
    if (p === "/") {
      goto(ok ? "/items" : "/setup", { replaceState: true });
      return;
    }
    if (!ok && p.startsWith("/items")) {
      goto("/setup", { replaceState: true });
      return;
    }
  });
</script>

<div class="app-frame">
  <NavBar />
  <div class="body">
    {@render children()}
  </div>
  <Toast />
</div>

<style>
  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    min-height: 0;
  }
</style>
