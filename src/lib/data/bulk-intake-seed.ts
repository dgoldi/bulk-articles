import type { BulkIntakeState, Draft } from "../types/bulk-intake";
import { CURRENT_SCHEMA_VERSION } from "../utils/migrations";

export const emptyDraft: Draft = {
  name: "",
  size: "",
  color: "",
  price: 0,
  photo: null,
  active: "name",
  addedCount: 0,
};

export const seedState: BulkIntakeState = {
  "@type": "BulkIntakeBatch",
  schemaVersion: CURRENT_SCHEMA_VERSION,
  template: {
    brand: "",
    category: "",
    photosOn: true,
    autoName: false,
    autoNamePrefix: "",
  },
  items: [],
  draft: emptyDraft,
  published: false,
};
