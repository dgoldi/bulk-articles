import { z } from "zod";

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.string(),
  color: z.string(),
  price: z.number().nonnegative(),
  photo: z.string().nullable(),
  brand: z.string(),
  category: z.string(),
});

export const TemplateSchema = z.object({
  brand: z.string(),
  category: z.string(),
  photosOn: z.boolean(),
  autoName: z.boolean(),
  autoNamePrefix: z.string(),
});

export const DraftActiveSchema = z.enum([
  "name",
  "size",
  "color",
  "price",
  "photo",
  "done",
]);

export const DraftSchema = z.object({
  name: z.string(),
  size: z.string(),
  color: z.string(),
  price: z.number().nonnegative(),
  photo: z.string().nullable(),
  active: DraftActiveSchema,
  addedCount: z.number().int().nonnegative(),
});

export const BulkIntakeStateSchema = z.object({
  "@type": z.literal("BulkIntakeBatch"),
  schemaVersion: z.number().int().positive(),
  template: TemplateSchema,
  items: z.array(ItemSchema),
  draft: DraftSchema,
  published: z.boolean(),
});

export const StrictItemSchema = ItemSchema.extend({
  name: z.string().trim().min(1, "Name fehlt"),
});

export const StrictBulkIntakeSchema = BulkIntakeStateSchema.extend({
  template: TemplateSchema.extend({
    brand: z.string().min(1, "Marke fehlt"),
    category: z.string().min(1, "Kategorie fehlt"),
  }),
  items: z.array(StrictItemSchema).min(1, "Keine Items"),
});

export type Item = z.infer<typeof ItemSchema>;
export type Template = z.infer<typeof TemplateSchema>;
export type DraftActive = z.infer<typeof DraftActiveSchema>;
export type Draft = z.infer<typeof DraftSchema>;
export type BulkIntakeState = z.infer<typeof BulkIntakeStateSchema>;
