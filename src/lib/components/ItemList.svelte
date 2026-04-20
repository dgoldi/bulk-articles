<script lang="ts">
  import { goto } from "$app/navigation";
  import { batch } from "$lib/state/bulk-intake.svelte";
  import StatBox from "./StatBox.svelte";
  import Pill from "./Pill.svelte";
  import ColorLabel from "./ColorLabel.svelte";

  const avg = $derived(
    batch.state.items.length
      ? (batch.total / batch.state.items.length).toFixed(2)
      : "0",
  );

  function goAdd(): void {
    goto("/items/add");
  }
  function edit(id: string): void {
    goto(`/items/edit/${encodeURIComponent(id)}`);
  }
</script>

{#if batch.state.items.length === 0}
  <div class="empty">
    <div class="icon">📦</div>
    <div class="title">No items yet</div>
    <div class="sub meta">
      {batch.state.template.brand} · {batch.state.template.category}
    </div>
    <button type="button" class="ab primary solo" onclick={goAdd}>
      + Add first item
    </button>
  </div>
{:else}
  <div class="fill">
    <div class="stats">
      <StatBox label="Items" value={batch.state.items.length} />
      <StatBox label="Avg" value={`CHF ${avg}`} color="#818cf8" />
      <StatBox
        label="Total"
        value={`CHF ${batch.total.toFixed(2)}`}
        color="var(--green)"
      />
    </div>

    <div class="list">
      {#each batch.state.items as it, i (it.id)}
        <div class="card">
          <div class="num">{i + 1}</div>
          {#if it.photo}
            <img class="thumb" src={it.photo} alt={it.name} />
          {/if}
          <div class="main">
            <div class="name">{it.name}</div>
            <div class="badges">
              {#if it.size}
                <Pill>{it.size}</Pill>
              {/if}
              {#if it.color}
                <ColorLabel color={it.color} />
              {/if}
              {#if it.photo}
                <Pill bg="var(--green-bg)" color="var(--green)">📸</Pill>
              {/if}
            </div>
          </div>
          <span class="price">
            {it.price > 0 ? `CHF ${it.price.toFixed(2)}` : "—"}
          </span>
          <button type="button" class="ch edit" onclick={() => edit(it.id)}>
            Edit
          </button>
        </div>
      {/each}
    </div>

    <div class="footer">
      <button type="button" class="ab primary" onclick={goAdd}>+ Add item</button>
    </div>
  </div>
{/if}

<style>
  .empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .icon {
    font-size: 40px;
    margin-bottom: 16px;
    opacity: 0.3;
  }
  .title {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .sub {
    font-size: 11px;
    color: var(--sub);
  }
  .meta {
    margin-bottom: 24px;
  }
  .fill {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .stats {
    display: flex;
    gap: 8px;
    padding: 10px 18px 6px;
  }
  .list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 18px;
  }
  .card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    margin-bottom: 6px;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  .num {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: var(--chip-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    color: #999;
    flex-shrink: 0;
  }
  .thumb {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid var(--border);
  }
  .main {
    flex: 1;
    min-width: 0;
  }
  .name {
    font-weight: 600;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .badges {
    display: flex;
    gap: 5px;
    margin-top: 3px;
    flex-wrap: wrap;
  }
  .price {
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 500;
    flex-shrink: 0;
  }
  .edit {
    padding: 5px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    background: var(--chip-bg);
    border: 1px solid var(--border);
    color: var(--muted);
    flex-shrink: 0;
  }
  .footer {
    padding: 12px 18px 16px;
    border-top: 1px solid var(--border-soft);
  }
  .primary {
    width: 100%;
    padding: 13px;
    background: var(--accent);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    text-align: center;
  }
  .primary.solo {
    flex: none;
    width: auto;
    padding: 13px 32px;
  }
</style>
