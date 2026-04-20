<script lang="ts">
  import { goto } from "$app/navigation";
  import { batch } from "$lib/state/bulk-intake.svelte";
  import { exportBatchAsJson } from "$lib/utils/file-io";

  function newBatch(): void {
    batch.reset();
    goto("/setup");
  }

  function downloadJson(): void {
    exportBatchAsJson(batch.state);
  }
</script>

<div class="center">
  <div class="pop card">
    <div class="check">✓</div>
    <div class="count">{batch.state.items.length} Published</div>
    <div class="total">CHF {batch.total.toFixed(2)}</div>
    <div class="meta">
      {batch.state.template.brand} · {batch.state.template.category}
    </div>
    <button type="button" class="ab secondary" onclick={downloadJson}>
      ⇩ Download JSON
    </button>
    <button type="button" class="ab primary" onclick={newBatch}>New batch</button>
  </div>
</div>

<style>
  .center {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .card {
    text-align: center;
  }
  .check {
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background: var(--green-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    font-size: 24px;
    color: var(--green);
  }
  .count {
    font-size: 22px;
    font-weight: 800;
    margin-bottom: 4px;
  }
  .total {
    font-family: var(--mono);
    font-size: 16px;
    color: var(--green);
    margin-bottom: 4px;
  }
  .meta {
    font-size: 11px;
    color: var(--sub);
  }
  .secondary {
    margin-top: 24px;
    width: 180px;
    padding: 12px;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-weight: 600;
    font-size: 13px;
  }
  .primary {
    margin-top: 8px;
    width: 180px;
    padding: 13px;
    background: var(--accent);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
  }
</style>
