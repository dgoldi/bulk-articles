# SvelteKit SPA Architecture Patterns

A browser-only single-page application built with SvelteKit in SPA mode (no SSR, no prerendering), Svelte 5 runes for reactive state, TypeScript strict, and Zod for runtime validation. There is no backend -- all data lives in the browser (localStorage), and the app runs entirely client-side. External integrations: Firebase Auth, pdfmake/pdf-lib for PDF generation, jspreadsheet-ce for spreadsheet UI.

## Svelte 5 -- Strict Runes Only

This project uses **Svelte 5 runes exclusively**. No legacy patterns:

- **`$state`** / **`$state.raw`** / **`$derived`** / **`$effect`** / **`$props`** -- always. No `let` exports, no `$:` reactive statements, no `writable`/`readable`/`derived` stores.
- **`{@render children()}`** -- always. No `<slot>`.
- **`{#snippet}`** / **`{@render}`** -- always. No named `<slot name="...">`.
- **`onclick={handler}`** -- always. No `on:click={handler}`.
- **`.svelte.ts`** modules for shared state -- always. No `writable()` stores, no Svelte store contract (`subscribe`/`set`/`update`).
- **`class:name={condition}`** or `class={expr}` for conditional classes -- no `$$props` or `$$restProps`.

When in doubt, follow the [Svelte 5 docs](https://svelte.dev/docs/svelte). If a pattern exists in both legacy and runes syntax, use the runes version.

## Tech Stack

| Layer | Library | Version |
|-------|---------|---------|
| Framework | SvelteKit | ^2.53 |
| UI | Svelte 5 (runes) | ^5.45 |
| Language | TypeScript (strict) | ~5.9 |
| Build | Vite | ^7.3 |
| Validation | Zod | ^4.3 |
| Auth | Firebase | ^12.10 |
| PDF render | pdfmake | ^0.3.5 |
| PDF postprocess | pdf-lib | ^1.17 |
| Spreadsheet | jspreadsheet-ce | ^5.0 |
| Image compression | browser-image-compression | ^2.0 |
| Runtime | Node | 24 |

---

## 1. Project Setup & Configuration

### SvelteKit config

Minimal -- adapter-auto detects the deployment target, `vitePreprocess` handles TypeScript in `.svelte` files:

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter()
  }
};
```

### SPA mode

Two exports in the root layout disable SSR and prerendering. The entire app runs in the browser:

```ts
// src/routes/+layout.ts
export const ssr = false;
export const prerender = false;
```

### Vite config

No custom configuration needed beyond the SvelteKit plugin:

```ts
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()]
});
```

### TypeScript

Strict mode with all JS files checked. `moduleDetection: "force"` ensures every file is treated as an ES module:

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "strict": true,
    "moduleDetection": "force"
  }
}
```

### HTML shell

Sets the document locale, loads fonts from Google, and provides SvelteKit placeholders:

```html
<!-- app.html -->
<!doctype html>
<html lang="de-CH">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Auftragsbestätigung</title>
    <link
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    %sveltekit.head%
  </head>
  <body>
    <div id="app">%sveltekit.body%</div>
  </body>
</html>
```

### Node engine constraint

Enforced via `package.json` + `.npmrc`:

```json
// package.json
{ "engines": { "node": "24" } }
```
```ini
# .npmrc
engine-strict=true
```

### Environment variables

Client-accessible vars use the `VITE_` prefix. Accessed via `import.meta.env`:

```ts
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

---

## 2. Reactive State Management (Svelte 5 Runes)

State lives in `.svelte.ts` modules as module-level `$state`. Components import state directly -- no stores, no context API, no prop drilling.

### 2a. Root state pattern

The primary data model: deep reactive `$state`, auto-persisted to localStorage, with `$derived` values exposed through getter functions.

```ts
// src/lib/state/order.svelte.ts
import type { Order } from '../types/order';
import { seedOrder } from '../data/order-seed';
import { calcOrderTotals, buildProductBySku } from '../utils/formatting';
import { parseExternalOrder } from '../utils/migrations';

const STORAGE_KEY = 'simple-order';

function loadSaved(): Order | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseExternalOrder(JSON.parse(raw));
  } catch {}
  return null;
}

// Root state -- deep proxy, all nested mutations reactive
export const order = $state<Order>(loadSaved() ?? structuredClone(seedOrder));
order.orderDate = new Date().toISOString().slice(0, 10);

$effect.root(() => {
  $effect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  });
});

// Derived -- exposed via getters (Svelte disallows exporting $derived from modules)
const totals = $derived(calcOrderTotals(order.acceptedOffer, order.taxRate));
const productMap = $derived(buildProductBySku(order.acceptedOffer));

export function getTotals() { return totals; }
export function getProductMap() { return productMap; }

// Mutations
export function loadOrder(data: Order) {
  Object.assign(order, data);
}

export function resetOrder() {
  loadOrder(structuredClone(seedOrder));
}
```

**Key decisions:**

- `$state<Order>(...)` creates a deeply reactive proxy -- nested property mutations (e.g., `order.supplier.name = "X"`) are tracked automatically.
- `$effect.root()` is needed outside of components because module-level code has no component lifecycle. The inner `$effect()` re-runs whenever `order` changes.
- `$derived` cannot be exported directly from `.svelte.ts` modules -- wrap in getter functions instead.
- `Object.assign(order, data)` for bulk state updates preserves the reactive proxy.
- `structuredClone()` ensures seed data is not shared between resets.

### 2b. Ephemeral state pattern

For transient UI state (notifications, modals). Private `$state` with public getter object:

```ts
// src/lib/state/toast.svelte.ts
let message = $state("");
let visible = $state(false);
let timer: ReturnType<typeof setTimeout> | undefined;

export function showToast(msg: string) {
  message = msg;
  visible = true;
  clearTimeout(timer);
  timer = setTimeout(() => { visible = false; }, 2600);
}

export function getToastState() {
  return {
    get message() { return message; },
    get visible() { return visible; },
  };
}
```

**Why getter objects?** Returning `{ message, visible }` would snapshot the values. JavaScript `get` accessors defer evaluation, so `toast.message` always returns the current reactive value.

### 2c. Async/external state pattern

For integrating with external async sources (Firebase, WebSockets, etc.):

```ts
// src/lib/state/auth.svelte.ts (excerpt)
let currentUser = $state<User | null>(null);
let claims = $state<Record<string, unknown> | null>(null);
let loading = $state(true);
let error = $state<string | null>(null);
const isAuthenticated = $derived(currentUser !== null);

// Listen to external async source
$effect.root(() => {
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
      const result = await user.getIdTokenResult();
      claims = result.claims as Record<string, unknown>;
    } else {
      claims = null;
    }
    loading = false;
  });
});

// Expose via getter object (same pattern as toast)
export function getAuthState() {
  return {
    get currentUser() { return currentUser; },
    get loading() { return loading; },
    get error() { return error; },
    get isAuthenticated() { return isAuthenticated; },
    get claims() { return claims; },
  };
}

// Localized error mapping
const errorMessages: Record<string, string> = {
  'auth/invalid-credential': 'E-Mail oder Passwort ungültig.',
  'auth/too-many-requests': 'Zu viele Versuche. Bitte später erneut versuchen.',
  // ...
};

async function handleAuthAction(fn: () => Promise<void>, fallbackLabel: string) {
  error = null;
  try {
    await fn();
  } catch (e: unknown) {
    const code = (e as { code?: string }).code ?? 'unknown';
    error = errorMessages[code] ?? `${fallbackLabel} (${code})`;
  }
}
```

### 2d. How components consume state

```svelte
<script lang="ts">
  // Direct import for mutable root state
  import { order } from '$lib/state/order.svelte';

  // Getter call for read-only derived/encapsulated state
  import { getAuthState } from '$lib/state/auth.svelte';
  const auth = getAuthState();

  // $derived in components wrapping getter calls
  import { getTotals } from '$lib/state/order.svelte';
  let totals = $derived(getTotals());
</script>

<!-- Reactive in template -->
{#if auth.isAuthenticated}
  <span>{totals.total.toFixed(2)}</span>
{/if}
```

---

## 3. Type System -- Zod Schemas as Source of Truth

Define Zod schemas first, derive TypeScript types with `z.infer`. This ensures runtime validation and compile-time safety use the same definitions.

### 3a. Schema.org JSON-LD compatibility

Types include `@type` and `@context` literal fields for Schema.org interoperability. This enables machine-readable data exchange (e.g., embedding order data as JSON-LD in PDFs):

```ts
// src/lib/types/order.ts
import { z } from "zod";

export const PostalAddressSchema = z.object({
  "@type": z.literal("PostalAddress"),
  name: z.string(),
  streetAddress: z.string(),
  postalCode: z.string(),
  addressLocality: z.string(),
  addressCountry: z.string().regex(/^[A-Z]{2}$/).or(z.literal("")),
});

export const ProductSchema = z.object({
  "@type": z.literal("Product"),
  sku: z.string(),
  name: z.string(),
  size: z.string(),
  color: z.string(),
  extendedDescription: z.string().optional(),  // app-specific extension
  image: z.string().optional(),                 // app-specific extension
});

export const OfferSchema = z.object({
  "@type": z.literal("Offer"),
  itemOffered: ProductSchema,
  price: z.number().nonnegative(),
  priceCurrency: z.enum(["CHF", "EUR", "USD"]),
  ep: z.number().nonnegative(),   // app-specific extension (cost price)
  eligibleQuantity: z.object({
    "@type": z.literal("QuantitativeValue"),
    value: z.number().int().nonnegative(),
  }),
});

export const OrderSchema = z.object({
  "@context": z.literal("https://schema.org"),
  "@type": z.literal("Order"),
  schemaVersion: z.number().int().positive(),
  orderNumber: z.string(),
  orderDate: z.iso.date().or(z.literal("")),
  supplier: PostalAddressSchema,
  customer: PostalAddressSchema,
  acceptedOffer: z.array(OfferSchema),
  taxRate: z.number().min(0).max(100),
  // ... more fields
});

// Types derived from schemas
export type PostalAddress = z.infer<typeof PostalAddressSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Offer = z.infer<typeof OfferSchema>;
export type Order = z.infer<typeof OrderSchema>;
```

### 3b. Base vs. Strict schemas

Base schemas are permissive (empty strings, zeros allowed) for data loading/persistence. Strict schemas extend base with business rules for validation gates (e.g., before PDF export):

```ts
// Base: allows empty SKU, zero prices
export const OfferSchema = z.object({
  price: z.number().nonnegative(),
  ep: z.number().nonnegative(),
  // ...
});

// Strict: requires non-empty SKU, positive prices, precision limits
const maxTwoDecimals = (v: number) => {
  const s = String(v);
  const d = s.indexOf('.');
  return d === -1 || s.length - d - 1 <= 2;
};

export const StrictOfferSchema = OfferSchema.extend({
  itemOffered: StrictProductSchema,
  price: z.number().positive("VP muss grösser als 0 sein")
    .refine(maxTwoDecimals, "VP: max 2 Dezimalstellen"),
  ep: z.number().positive("EP muss grösser als 0 sein")
    .refine(maxTwoDecimals, "EP: max 2 Dezimalstellen"),
  eligibleQuantity: QuantitativeValueSchema.extend({
    value: z.number().int().positive("Menge muss grösser als 0 sein"),
  }),
});

export const StrictOrderSchema = OrderSchema.extend({
  orderDate: z.iso.date({ error: "Auftragsdatum fehlt" }),
  supplier: PostalAddressSchema.extend({
    name: z.string().trim().min(1, "Lieferantenname fehlt"),
  }),
  acceptedOffer: z.array(StrictOfferSchema).min(1, "Keine Positionen vorhanden"),
});
```

### 3c. Accessor functions

Schema.org types use nested structures and sometimes strings for numeric precision. Accessor functions provide a stable API that isolates consumers from the internal shape:

```ts
// src/lib/utils/formatting.ts
export const offerVp = (o: Offer): number => o.price;
export const offerEp = (o: Offer): number => o.ep;
export const offerQty = (o: Offer): number => Number(o.eligibleQuantity?.value) || 0;
```

Rule: never access `offer.price` or `offer.eligibleQuantity.value` directly in components or utilities -- always use accessors.

### 3d. Derived computations

Single source of truth for calculations, used by both the UI and PDF generation:

```ts
// src/lib/utils/formatting.ts
export function calcOrderTotals(offers: Offer[], taxRate: number) {
  const subtotal = offers.reduce((s, o) => s + offerVp(o) * offerQty(o), 0);
  const vat = subtotal * taxRate / 100;
  return { subtotal, vat, total: subtotal + vat };
}

export function buildProductBySku(offers: Offer[]): Map<string, Product> {
  const map = new Map<string, Product>();
  for (const o of offers) {
    const p = o.itemOffered;
    if (p.sku && !map.has(p.sku)) map.set(p.sku, p);
  }
  return map;
}
```

---

## 4. Data Persistence & Schema Migrations

### 4a. localStorage persistence

Auto-save via `$effect` in the state module (see section 2a). Load with migration + validation on startup:

```ts
function loadSaved(): Order | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseExternalOrder(JSON.parse(raw));  // migrate + validate
  } catch {}
  return null;
}
```

### 4b. Schema versioning & migration registry

A `schemaVersion` integer field in persisted data enables forward-compatible migrations. Each migration transforms vN to v(N+1):

```ts
// src/lib/utils/migrations.ts
export const CURRENT_SCHEMA_VERSION = 4;

type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

const migrations: Record<number, Migration> = {
  1: (obj) => {
    // v1 -> v2: string prices to numbers
    const offers = obj.acceptedOffer;
    if (Array.isArray(offers)) {
      for (const offer of offers) {
        if (typeof offer === 'object' && offer !== null) {
          const o = offer as Record<string, unknown>;
          if (typeof o.price === 'string') o.price = parseFloat(o.price) || 0;
          if (typeof o.ep === 'string') o.ep = parseFloat(o.ep) || 0;
        }
      }
    }
    obj.schemaVersion = 2;
    return obj;
  },
  2: (obj) => {
    // v2 -> v3: taxRate from decimal (0.077) to percentage (7.7)
    if (typeof obj.taxRate === 'number') {
      obj.taxRate = obj.taxRate * 100;
    }
    obj.schemaVersion = 3;
    return obj;
  },
  3: (obj) => {
    // v3 -> v4: remove deprecated field
    delete obj.paymentDueDate;
    obj.schemaVersion = 4;
    return obj;
  },
};

export function migrateOrder(data: unknown): unknown {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return data;  // let Zod handle the validation error
  }
  const obj = data as Record<string, unknown>;

  // Stamp unversioned data as v1
  if (!("schemaVersion" in obj) || typeof obj.schemaVersion !== "number") {
    obj.schemaVersion = 1;
  }

  // Reject future versions
  if ((obj.schemaVersion as number) > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Order has schemaVersion ${obj.schemaVersion}, but app only supports up to ${CURRENT_SCHEMA_VERSION}`,
    );
  }

  // Run migrations sequentially
  while ((obj.schemaVersion as number) < CURRENT_SCHEMA_VERSION) {
    const v = obj.schemaVersion as number;
    const fn = migrations[v];
    if (!fn) throw new Error(`Missing migration from v${v}`);
    fn(obj);
  }

  return obj;
}

// Two-step pipeline: migrate then validate
export function parseExternalOrder(data: unknown): Order {
  return parseOrder(migrateOrder(data));
}
```

### 4c. JSON import/export

```ts
// src/lib/utils/file-io.ts
export function exportOrderAsJson(od: Order): void {
  const json = JSON.stringify(od, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  triggerBlobDownload(blob, `auftrag-${od.orderNumber || "order"}.json`);
}

export async function importOrderFromJson(file: File): Promise<Order> {
  const text = await file.text();
  return parseExternalOrder(JSON.parse(text));  // migrate + validate
}
```

### 4d. Blob download utility

```ts
// src/lib/utils/download.ts
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### 4e. Client-side image compression

Images are compressed before embedding in state (and later in PDFs), stored as DataURLs:

```ts
// src/lib/utils/image.ts
import imageCompression from "browser-image-compression";

export async function compressImage(file: File): Promise<string> {
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 600,
    maxSizeMB: 0.1,
    fileType: "image/jpeg",
    initialQuality: 0.7,
  });
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(compressed);
  });
}
```

---

## 5. Component Patterns

### 5a. Props with interface

Svelte 5 uses `$props()` instead of `export let`. Define a `Props` interface for type safety:

```svelte
<script lang="ts">
  interface Props {
    message: string;
    visible: boolean;
  }
  let { message, visible }: Props = $props();
</script>

<div class="toast" class:show={visible}>{message}</div>
```

### 5b. Layout and children rendering

`{@render children()}` replaces `<slot>` in Svelte 5:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { getToastState } from "$lib/state/toast.svelte";
  import Header from "$lib/components/Header.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import Toast from "$lib/components/Toast.svelte";
  import "../app.css";

  let { children } = $props();
  const toast = getToastState();
</script>

<div class="page">
  <Header />
  {@render children()}
  <Footer />
  <Toast message={toast.message} visible={toast.visible} />
</div>
```

### 5c. Snippets for reusable fragments

Snippets are parameterized, reusable markup blocks within a component. They replace named slots:

```svelte
{#snippet addressCard(label: string, addr: PostalAddress)}
  <div class="card">
    <div class="label">{label}</div>
    <input bind:value={addr.name} class="addr-name" spellcheck="false" />
    <input bind:value={addr.streetAddress} class="addr-sub" spellcheck="false" />
  </div>
{/snippet}

<div class="cards">
  {@render addressCard("Lieferant", order.supplier)}
  {@render addressCard("Kunde", order.customer)}
</div>
```

### 5d. Snippets as props (callback pattern)

Pass a close/action callback through snippet parameters for composable behavior:

```svelte
<!-- DropdownMenu.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    label: string;
    children: Snippet<[() => void]>;  // consumer receives closeMenu callback
  }
  let { label, children }: Props = $props();
  let menuOpen = $state(false);
  function closeMenu() { menuOpen = false; }
</script>

{#if menuOpen}
  <div class="menu-dropdown" role="menu">
    {@render children(closeMenu)}
  </div>
{/if}
```

Consumer usage:

```svelte
<DropdownMenu label="Datei">
  {#snippet children(close)}
    <button onclick={() => { handleExport(); close(); }}>Export</button>
  {/snippet}
</DropdownMenu>
```

### 5e. DOM references

Use `$state.raw()` for non-reactive references to DOM elements or library instances:

```svelte
<script lang="ts">
  let container: HTMLDivElement | undefined = $state.raw();
  let spreadsheet: any = $state.raw(null);
</script>

<div bind:this={container}></div>
```

### 5f. Navigation

SvelteKit file-based routing with `<a>` links. For programmatic navigation, use `goto()`:

```svelte
<!-- Link navigation -->
<a href="/details" class="back-btn">Produktdetails</a>

<!-- Programmatic navigation -->
<script lang="ts">
  import { goto } from '$app/navigation';
  function navigate() { goto('/edit'); }
</script>
```

Routes are thin wrappers: each `+page.svelte` imports components and wires up state.

---

## 6. Validation with UI Error Mapping

Zod validation results are mapped to grid cell coordinates for visual error feedback. This separates validation logic from UI rendering:

```ts
// src/lib/utils/validation.ts
import type { ZodIssue } from "zod";
import type { Order } from "../types/order";
import { StrictOrderSchema } from "../types/order";
import { COL } from "./spreadsheet";

export interface CellError {
  row: number;
  col: number;
}

export interface ValidationResult {
  valid: boolean;
  headerMessages: string[];  // top-level errors (supplier name, date, etc.)
  cellErrors: CellError[];   // row-level errors (mapped to grid cells)
}

// Map Zod field paths to grid column indices
export const OFFER_FIELD_TO_COL: Record<string, number> = {
  "itemOffered.sku": COL.SKU,
  price: COL.VP,
  ep: COL.EP,
  "eligibleQuantity.value": COL.QTY,
};

function mapZodErrorsToCells(issues: ZodIssue[]): {
  headerMessages: string[];
  cellErrors: CellError[];
} {
  const headerMessages: string[] = [];
  const cellErrors: CellError[] = [];

  for (const issue of issues) {
    const path = issue.path;
    // Row-level: acceptedOffer.{i}.field...
    if (path[0] === "acceptedOffer" && typeof path[1] === "number") {
      const row = path[1];
      const fieldPath = path.slice(2).join(".");
      const col = OFFER_FIELD_TO_COL[fieldPath];
      if (col !== undefined) {
        cellErrors.push({ row, col });
        continue;
      }
    }
    // Everything else is a header-level error
    headerMessages.push(issue.message);
  }

  return { headerMessages, cellErrors };
}

export function validateOrderForPdf(order: Order): ValidationResult {
  const result = StrictOrderSchema.safeParse(order);
  if (result.success) {
    return { valid: true, headerMessages: [], cellErrors: [] };
  }
  const { headerMessages, cellErrors } = mapZodErrorsToCells(result.error.issues);
  return { valid: false, headerMessages, cellErrors };
}

export function formatValidationErrors(result: ValidationResult): string {
  const parts: string[] = [];
  if (result.headerMessages.length > 0) {
    parts.push(...result.headerMessages);
  }
  if (result.cellErrors.length > 0) {
    parts.push(`${result.cellErrors.length} ungültige Zelle(n) in der Tabelle`);
  }
  return parts.join("\n");
}
```

Cell errors are applied as styles in the grid component:

```ts
function highlightErrors() {
  const result = validateOrderForPdf(order);
  const errorSet = new Set(result.cellErrors.map(e => `${e.col},${e.row}`));
  const styles: Record<string, string> = {};
  for (let r = 0; r < rowCount; r++) {
    for (const c of VALIDATED_COLS) {
      const cellName = String.fromCharCode(65 + c) + (r + 1);
      styles[cellName] = errorSet.has(`${c},${r}`)
        ? "background-color: #fef2f2"
        : "background-color:";
    }
  }
  spreadsheet.setStyle(styles);
}
```

---

## 7. Imperative Library Integration

When integrating imperative libraries (jspreadsheet, chart libraries, map renderers), the key challenges are lifecycle management, bidirectional data sync, and event suppression.

### 7a. Initialization and cleanup

Initialize in `onMount`, store instance in `$state.raw()` (non-reactive), clean up on unmount:

```ts
let container: HTMLDivElement | undefined = $state.raw();
let spreadsheet: any = $state.raw(null);

onMount(() => {
  const instances = jspreadsheet(container, { /* config */ });
  spreadsheet = instances[0];

  return () => {
    jspreadsheet.destroy(container as any);
  };
});
```

### 7b. Column enum

Type-safe column references via a `const` object. All code uses these constants instead of magic numbers:

```ts
// src/lib/utils/spreadsheet.ts
export const COL = {
  SKU: 0, NAME: 1, SIZE: 2, COLOR: 3,
  QTY: 4, EP: 5, VP: 6, TOTAL: 7,
} as const;

// Typed tuple for one jspreadsheet row
export type SheetRow = [string, string, string, string, string, string, string, string];
```

### 7c. Bidirectional data sync

Convert between typed objects and 2D string arrays. Metadata preservation via SKU-keyed lookup during reverse conversion:

```ts
// Typed objects -> 2D array (for jspreadsheet)
export function offersTo2D(offers: Offer[]): SheetRow[] {
  return offers.map((o) => {
    const vp = offerVp(o);
    const qty = offerQty(o);
    return [
      o.itemOffered.sku || "",
      o.itemOffered.name || "",
      o.itemOffered.size || "",
      o.itemOffered.color || "",
      String(qty), String(offerEp(o)), String(vp), String(vp * qty),
    ];
  });
}

// 2D array -> typed objects (preserves metadata not shown in grid)
export function sheetDataToOffers(data: SheetRow[], order: Order): Offer[] {
  const productBySku = buildProductBySku(order.acceptedOffer);
  return data.map((row) => {
    const sku = row[COL.SKU] ?? "";
    const existing = productBySku.get(sku);
    return {
      "@type": "Offer",
      itemOffered: {
        "@type": "Product",
        sku,
        name: row[COL.NAME] ?? "",
        // ...
        extendedDescription: existing?.extendedDescription,  // preserved
        image: existing?.image,                               // preserved
      },
      price: Number(row[COL.VP]) || 0,
      // ...
    };
  });
}
```

### 7d. Event suppression

Two mechanisms prevent infinite sync loops during programmatic updates:

**`batchUpdate` flag** -- guards multi-row operations (delete, paste):

```ts
let batchUpdate = false;

// In jspreadsheet config:
onchange: function() {
  if (batchUpdate) return;
  syncFromSheet();
},

// In batch operations:
function deleteSelected() {
  batchUpdate = true;
  for (let i = sel.length - 1; i >= 0; i--) {
    spreadsheet.deleteRow(sel[i]);
  }
  batchUpdate = false;
  syncFromSheet();  // one sync after all deletions
}
```

**`ignoreEvents`** -- suppresses library events during programmatic cell updates:

```ts
function syncFromSheet() {
  const data = spreadsheet.getData() as SheetRow[];
  const root = spreadsheet.parent ?? spreadsheet;

  root.ignoreEvents = true;
  for (let i = 0; i < data.length; i++) {
    const vp = Number(data[i][COL.VP]) || 0;
    const qty = Number(data[i][COL.QTY]) || 0;
    spreadsheet.setValueFromCoords(COL.TOTAL, i, (vp * qty).toFixed(2), true);
  }
  root.ignoreEvents = false;

  order.acceptedOffer = sheetDataToOffers(data, order);
  highlightErrors();
}
```

### 7e. Localization of library UI

Translate built-in context menu strings:

```ts
jspreadsheet.setDictionary({
  'Insert a new row before': 'Zeile oberhalb einfügen',
  'Delete selected rows': 'Zeile löschen',
  'Copy': 'Kopieren',
  'Paste': 'Einfügen',
});
```

### 7f. Third-party CSS overrides

Use `:global()` inside component `<style>` blocks to override library styles:

```css
.grid-wrapper :global(.jexcel td) {
  border-color: var(--c200);
  padding: 4px 8px;
}
.grid-wrapper :global(.jexcel thead td) {
  background-color: var(--c50);
  color: var(--c500);
  font-size: 11px;
  text-transform: uppercase;
}
```

---

## 8. PDF Generation Pipeline

Three-file separation of concerns:

```
pdf-sections.ts  -->  pdf.ts (orchestrator)  -->  pdf-postprocess.ts
(content builders)     (compose + render)         (PDF/A compliance)
```

### 8a. Orchestrator

Composes sections, renders via pdfmake, postprocesses with pdf-lib, validates, downloads:

```ts
// src/lib/utils/pdf.ts
export async function generateAndDownloadPDF(od: Order): Promise<{ success: boolean; message: string }> {
  try {
    od.orderNumber = generateOrderNumber();
    od.orderDate = new Date().toISOString().slice(0, 10);
    const { subtotal, vat, total } = calcOrderTotals(od.acceptedOffer, od.taxRate);

    const docDefinition: TDocumentDefinitions = {
      pageSize: "A4",
      pageMargins: [57, 57, 57, 57],
      content: [
        ...buildTitleSection(od),
        ...buildAddressSection(od.supplier, od.customer),
        ...buildOffersTable(od.acceptedOffer, od.taxRate),
        ...buildSummarySection(subtotal, vat, total, od.priceCurrency, od.taxRate),
        ...buildOptionalNotes(od.description),
        ...buildProductDetailsSection(od),
      ],
      footer: buildFooter(od.contactDetails),
      defaultStyle: { font: "Roboto" },
    };

    const pdfBuffer = await renderPdfBuffer(docDefinition);
    const finalPdf = await embedJsonLdAttachment(pdfBuffer, od);

    if (!await validateAttachment(finalPdf)) {
      return { success: false, message: "Fehler: Anhang konnte nicht eingebettet werden" };
    }

    triggerDownload(finalPdf, od.orderNumber);
    return { success: true, message: "PDF heruntergeladen" };
  } catch (err: any) {
    return { success: false, message: "PDF-Fehler: " + (err.message || String(err)) };
  }
}
```

### 8b. Composable section builders

Each builder returns an array of pdfmake content nodes. Spread into the `content` array:

```ts
// src/lib/utils/pdf-sections.ts
export function buildTitleSection(od: Order) {
  const nodes: any[] = [
    { text: "Auftragsbestätigung", fontSize: 22, bold: true },
    { columns: [ /* order number, date */ ] },
  ];
  // Conditional content
  if (od.deliveryDateFrom || od.deliveryDateTo) {
    nodes.push({ text: `Lieferdatum: ...`, fontSize: 10 });
  }
  nodes.push({ canvas: [{ type: "line", /* divider */ }] });
  return nodes;
}

// Empty section = no output
export function buildOptionalNotes(description?: string) {
  if (!description?.trim()) return [];
  return [{ text: description, fontSize: 10, margin: [0, 10, 0, 0] }];
}
```

### 8c. PDF/A-3b compliance & JSON-LD embedding

Postprocessing with pdf-lib to embed JSON-LD data and XMP metadata:

```ts
// src/lib/utils/pdf-postprocess.ts

// pdfmake type workaround -- UMD build has type mismatch
// @ts-ignore
import pdfMake from "pdfmake/build/pdfmake";
// @ts-ignore
import fontContainer from "pdfmake/build/fonts/Roboto";
import { PDFDocument, PDFName } from "pdf-lib";

pdfMake.addFontContainer(fontContainer);

export async function renderPdfBuffer(docDefinition: TDocumentDefinitions): Promise<Uint8Array> {
  return pdfMake.createPdf(docDefinition).getBuffer();
}

export async function embedJsonLdAttachment(pdfBuffer: Uint8Array, od: Order): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  // Attach JSON-LD data
  const jsonBytes = new TextEncoder().encode(JSON.stringify(od, null, 2));
  await pdfDoc.attach(jsonBytes, "order-data.json", {
    mimeType: "application/json",
    description: "Auftragsdaten (JSON-LD, Schema.org/Order)",
    creationDate: new Date(),
    modificationDate: new Date(),
  });

  // PDF/A-3b: set AFRelationship on filespec
  const namesDict = pdfDoc.catalog.lookup(PDFName.of("Names")) as any;
  const efDict = namesDict?.lookup(PDFName.of("EmbeddedFiles"));
  const namesArr = efDict?.lookup(PDFName.of("Names"));
  const filespecRef = namesArr?.get(1);
  const filespecDict = filespecRef && (pdfDoc.context.lookup(filespecRef) as any);
  filespecDict?.set(PDFName.of("AFRelationship"), PDFName.of("Data"));

  // PDF/A-3b: embed XMP metadata stream
  const xmpXml = buildXmpMetadata(od.orderNumber, new Date().toISOString());
  const metadataStreamBytes = new TextEncoder().encode(xmpXml);
  const metadataStream = pdfDoc.context.stream(metadataStreamBytes, {
    Type: "Metadata", Subtype: "XML", Length: metadataStreamBytes.length,
  });
  pdfDoc.catalog.set(PDFName.of("Metadata"), pdfDoc.context.register(metadataStream));

  return pdfDoc.save();
}
```

Pipeline: `pdfmake renders` -> `pdf-lib embeds attachment + XMP` -> `validate` -> `download`

---

## 9. CSS Architecture

### Global styles

Minimal reset, CSS custom properties for the color palette, base typography, and reusable utility classes:

```css
/* src/app.css */
:root {
  --c50: #fafaf8;    /* lightest background */
  --c100: #f6f5f0;
  --c200: #f0eee9;
  --c300: #e4e2dd;   /* borders */
  --c400: #9a9a9a;   /* secondary text */
  --c500: #5c5c5c;   /* body text */
  --c600: #1a1a1a;   /* primary text */
  --g: #2c5f2d;      /* accent green */
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: "IBM Plex Sans", sans-serif;
  background: var(--c50);
  color: var(--c600);
  line-height: 1.5;
}

.page {
  max-width: 890px;
  margin: 0 auto;
  padding: 24px;
}

button {
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid var(--c300);
  background: #fff;
  color: var(--c500);
  cursor: pointer;
}

button:hover { background: var(--c100); color: var(--c600); }

.primary { background: var(--c600); color: #fff; border-color: var(--c600); }
.primary:hover { background: #333; }

.label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--c400);
  font-weight: 500;
}

@media print {
  .no-print { display: none !important; }
}
```

### Component-scoped styles

Svelte `<style>` blocks are auto-scoped to the component. Use `:global()` only for third-party library overrides.

---

## Appendix: Project Structure

```
src/
  app.html                         HTML shell (locale, fonts, viewport)
  app.css                          Global styles (CSS vars, reset, base)
  lib/
    firebase.ts                    Firebase init (env vars -> config)
    state/
      order.svelte.ts              Root state (data, persistence, derived)
      toast.svelte.ts              Ephemeral UI state (notifications)
      auth.svelte.ts               Auth state (Firebase, claims, errors)
    types/
      order.ts                     Zod schemas + TypeScript types
    utils/
      formatting.ts                Accessors, calculations, date/locale
      spreadsheet.ts               Column enum, 2D <-> typed objects
      validation.ts                Zod validation -> grid cell error mapping
      migrations.ts                Schema versioning + migration registry
      pdf.ts                       PDF orchestrator
      pdf-sections.ts              PDF content builders
      pdf-postprocess.ts           PDF/A compliance, JSON-LD embedding
      file-io.ts                   JSON import/export
      download.ts                  Blob download utility
      image.ts                     Image compression
      order-number.ts              Order number generation
    components/
      Header.svelte                App header with auth button
      Footer.svelte                App footer
      AddressCards.svelte           Supplier/customer address inputs
      OrderGrid.svelte             jspreadsheet integration
      ActionBar.svelte             PDF download, export/import actions
      ProductDetails.svelte        Product editor with image upload
      Toast.svelte                 Notification display
      DropZone.svelte              Drag-and-drop file loader
      DropdownMenu.svelte          Reusable menu with snippet callback
      AuthButton.svelte            Login/logout toggle
      JsonEditor.svelte            Raw JSON editor
    data/
      order-seed.ts                Default/seed data
  routes/
    +layout.ts                     SPA config (ssr=false, prerender=false)
    +layout.svelte                 Shell layout (Header, Footer, Toast)
    +page.svelte                   Main view (AddressCards, OrderGrid, ActionBar)
    edit/+page.svelte              JSON editor view
    details/+page.svelte           Product details view
    admin/+page.svelte             Auth/settings view
```
