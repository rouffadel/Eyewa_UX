---
component: product-catalog-card
parent: specs/005-sell-dashboard
status: done
created: 2026-06-20
updated: 2026-06-28
---

# Component: Product catalog card

**Parent index:** [`../../spec.md`](../../spec.md)

**Column 2 (top)** — category tabs, search toolbar, product grid.

## Category tabs

| # | Label | Key |
|---|-------|-----|
| 1 | Frames | `frames` |
| 2 | Lenses | `lenses` |
| 3 | Accessories | `accessories` |
| 4 | Contact Lens | `contact-lens` |

Active tab: blue pill styling.

## Toolbar

| Control | Behavior |
|---------|----------|
| Search | Filters mock list by name, SKU, or barcode; placeholder per tab |
| Barcode | **Inside search field** (right icon); opens camera scan |
| Filter | Stub — status toast |

### Barcode scan (Done — mock catalog)

| Step | Behavior |
|------|----------|
| Tap scan icon | `@capacitor/barcode-scanner` (`BarcodeScanService`) |
| On scan | Set search text; lookup by barcode or SKU |
| Match in category | Add to cart + success toast |
| Match other category | Switch tab, add to cart |
| No match | Filter search + “No product found” toast |
| Cancel scan | No message |

Mock frame barcodes (examples): `8690001000001` → Ray-Ban RB 2140 (`FRM-0001`).

**Native:** Android `minSdkVersion` 26; iOS `NSCameraUsageDescription` required.

## Product tile

| Element | Example |
|---------|---------|
| Image | Placeholder SVG |
| Brand + model | Ray-Ban RB 2140 |
| SKU | FRM-0001 |
| Price | **650.00 SAR** |

Grid uses **container queries** on `.catalog-card` (see parent spec).

Tap tile → **add to cart** (blocked if no customer — status banner).

## Phase 3 — API

| Service | Endpoint | Use |
|---------|----------|-----|
| [`BrandService`](../../services/spec.md) | `products/GetBrand` | Brand lookup |
| Catalog (TBD) | Products by category | Replace mock grid + barcode lookup |

## Copy

| Tab | Search placeholder |
|-----|-------------------|
| Frames | Search frames… |
| Lenses | Search lenses… |
| Accessories | Search accessories… |
| Contact Lens | Search contact lens… |

## User stories

- [x] Four tabs with active styling
- [x] Product grid with SKU, price in SAR
- [x] Tap adds to cart when customer selected
- [x] Search filters by name / SKU / barcode
- [x] Barcode scanner inside search box (Capacitor + mock lookup)
- [x] Filter icon stub
- [ ] Live catalog + brand API wired to grid

## Implementation

| File | Role |
|------|------|
| `product-catalog-card/product-catalog-card.component.*` | UI |
| `models/product.models.ts` | `Product` (+ optional `barcode`) |
| `services/sell.mock-data.ts` | Mock products, `findProductByBarcode()` |
| `services/barcode-scan.service.ts` | Capacitor scan wrapper |
| `services/sell-session.store.ts` | `scanProductBarcode()`, `applyScannedBarcode()` |
