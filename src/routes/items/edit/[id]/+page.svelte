<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { batch } from "$lib/state/bulk-intake.svelte";
  import EditItem from "$lib/components/EditItem.svelte";

  const id = $derived(page.params.id ?? "");
  const item = $derived(batch.getItemById(id));

  $effect(() => {
    if (!item) goto("/items", { replaceState: true });
  });
</script>

{#if item}
  <EditItem {item} />
{/if}
