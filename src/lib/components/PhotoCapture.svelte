<script lang="ts">
  import { handlePhotoFile } from "$lib/utils/photo-upload";

  interface Props {
    onCapture: (dataUrl: string) => void;
  }
  let { onCapture }: Props = $props();

  let fileInput: HTMLInputElement | undefined = $state.raw();
  let flash = $state(false);
  let busy = $state(false);

  $effect(() => {
    if (!flash) return;
    const id = setTimeout(() => {
      flash = false;
    }, 130);
    return () => clearTimeout(id);
  });

  function openPicker(): void {
    fileInput?.click();
  }

  async function handleChange(e: Event): Promise<void> {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file || busy) return;
    busy = true;
    flash = true;
    const dataUrl = await handlePhotoFile(file);
    busy = false;
    if (dataUrl) onCapture(dataUrl);
  }
</script>

{#if flash}
  <div class="flash"></div>
{/if}

<div class="center">
  <button type="button" class="ab big" onclick={openPicker} disabled={busy}>
    <span class="icon">📸</span>
    <span class="label">{busy ? "Verarbeite …" : "Tap to capture"}</span>
  </button>
  <input
    bind:this={fileInput}
    class="hidden"
    type="file"
    accept="image/*"
    capture="environment"
    onchange={handleChange}
  />
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
  .big {
    width: 160px;
    height: 160px;
    border-radius: 20px;
    background: var(--bg-alt);
    border: 2px dashed var(--border);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .big:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .icon {
    font-size: 40px;
  }
  .label {
    font-size: 14px;
    font-weight: 600;
    color: var(--muted);
    margin-top: 8px;
  }
  .flash {
    position: fixed;
    inset: 0;
    background: #000;
    z-index: 999;
    opacity: 0.1;
    pointer-events: none;
  }
  .hidden {
    display: none;
  }
</style>
