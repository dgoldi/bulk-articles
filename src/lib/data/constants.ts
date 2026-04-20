export const BRANDS = [
  "Zara",
  "H&M",
  "Levi's",
  "Mango",
  "COS",
  "Massimo Dutti",
  "& Other Stories",
  "Arket",
  "Weekday",
  "Uniqlo",
  "Nike",
  "Adidas",
] as const;

export const CATEGORIES = [
  "Dress",
  "Top",
  "Pants",
  "Skirt",
  "Outerwear",
  "Shoes",
  "Bag",
  "Accessory",
  "Knitwear",
  "Swimwear",
] as const;

export const SIZES = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "26",
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
  "44",
] as const;

export const COLORS = [
  { name: "Black", hex: "#222" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Grey", hex: "#999" },
  { name: "Beige", hex: "#d4c5a9" },
  { name: "Brown", hex: "#6b4226" },
  { name: "Red", hex: "#c0392b" },
  { name: "Blue", hex: "#2980b9" },
  { name: "Green", hex: "#27ae60" },
  { name: "Pink", hex: "#e91e8a" },
] as const satisfies readonly { name: string; hex: string }[];

export type ColorName = (typeof COLORS)[number]["name"];
export type BrandName = (typeof BRANDS)[number];
export type BrandTier = 0 | 1 | 2;

export const COLOR_MAP: Readonly<Record<ColorName, string>> =
  Object.fromEntries(COLORS.map((c) => [c.name, c.hex])) as Record<
    ColorName,
    string
  >;

export const BRAND_TIER: Readonly<Record<BrandName, BrandTier>> = {
  "H&M": 0,
  Zara: 0,
  Mango: 0,
  Weekday: 0,
  Uniqlo: 0,
  "Levi's": 1,
  Nike: 1,
  Adidas: 1,
  COS: 1,
  "Massimo Dutti": 2,
  "& Other Stories": 2,
  Arket: 2,
};

export const TIER_LBL = ["FAST FASHION", "MID", "PREMIUM"] as const;

export const PRICES = [
  4.9, 9.9, 14.9, 19.9, 29.9, 39.9, 49.9, 69.9, 89.9, 129.9, 179.9, 249.9,
] as const;
