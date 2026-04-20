<script lang="ts">
  interface Props {
    label: string;
    value: string | number;
    color?: string;
  }
  let { label, value, color = "#111" }: Props = $props();
</script>

<div class="stat">
  <div class="label">{label}</div>
  <div class="value" style:color>{value}</div>
</div>

<style>
  .stat {
    flex: 1;
    background: var(--bg-alt);
    border: 1px solid var(--border-soft);
    border-radius: 8px;
    padding: 8px 10px;
  }
  .label {
    font-size: 11px;
    color: var(--sub);
    margin-top: 1px;
  }
  .value {
    font-size: 17px;
    font-weight: 800;
    margin-top: 2px;
  }
</style>
