export async function compressImage(file: File): Promise<string> {
  const { default: imageCompression } = await import("browser-image-compression");
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 600,
    maxSizeMB: 0.1,
    fileType: "image/jpeg",
    initialQuality: 0.7,
  });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("FileReader: non-string result"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader error"));
    reader.readAsDataURL(compressed);
  });
}
