import type { BulkIntakeState } from "../types/bulk-intake";
import { triggerBlobDownload } from "./download";

function timestampSlug(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}`
  );
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function exportBatchAsJson(b: BulkIntakeState): void {
  const parts = ["bulk-intake"];
  if (b.template.brand) parts.push(slug(b.template.brand));
  if (b.template.category) parts.push(slug(b.template.category));
  parts.push(timestampSlug());
  const filename = `${parts.join("-")}.json`;
  const blob = new Blob([JSON.stringify(b, null, 2)], {
    type: "application/json",
  });
  triggerBlobDownload(blob, filename);
}
