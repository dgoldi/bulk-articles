<script lang="ts">
  interface Props {
    label: string;
    sub: string;
    on: boolean;
    onToggle: () => void;
  }
  let { label, sub, on, onToggle }: Props = $props();
</script>

<div class="row">
  <div>
    <span class="title">{label}</span>
    <div class="sub">{sub}</div>
  </div>
  <button
    type="button"
    class="ch tog"
    class:on
    aria-pressed={on}
    aria-label={label}
    onclick={onToggle}
  >
    <div class="knob"></div>
  </button>
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-alt);
    border: 1px solid var(--border-soft);
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 4px;
  }
  .title {
    font-weight: 600;
    font-size: 13px;
  }
  .sub {
    font-size: 11px;
    color: var(--sub);
    margin-top: 1px;
  }
  .tog {
    width: 44px;
    height: 24px;
    border-radius: 12px;
    border: none;
    display: flex;
    align-items: center;
    padding: 2px;
    background: #ddd;
    justify-content: flex-start;
    transition: all 0.2s;
  }
  .tog.on {
    background: var(--green);
    justify-content: flex-end;
  }
  .knob {
    width: 20px;
    height: 20px;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }
</style>
