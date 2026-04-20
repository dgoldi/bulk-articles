import { compressImage } from "./image";
import { showToast } from "$lib/state/toast.svelte";

export async function handlePhotoFile(file: File): Promise<string | null> {
  try {
    return await compressImage(file);
  } catch (err) {
    console.warn("Photo compression failed:", err);
    showToast("Foto konnte nicht verarbeitet werden.");
    return null;
  }
}
