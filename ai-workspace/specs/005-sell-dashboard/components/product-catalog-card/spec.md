---
component: product-catalog-card
parent: specs/005-sell-dashboard
status: in-progress
created: 2026-06-20
updated: 2026-06-18
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

Active tab: blue text + underline.

## Toolbar

| Control | Behavior |
|---------|----------|
| Search | Debounced filter (mock list Phase 2) |
| Barcode icon | Stub (Phase 4 native) |
| Filter icon | Stub |

## Product tile

| Element | Example |
|---------|---------|
| Image | Placeholder / line art |
| Brand + model | Ray-Ban RB 2140 |
| SKU | FRM-0001 |
| Price | **650.00 SAR** |

Grid: 4 columns tablet, 2 phone. Pagination dots stub.

Tap tile → **add to cart** (blocked if no customer selected).

## Phase 3 — API

| Service | Endpoint | Use |
|---------|----------|-----|
| [`BrandService`](../../services/spec.md) | `Admin/GetBrand?BrandName={query}` | Brand lookup / filter |
| Catalog (TBD) | Products by category | Replace mock grid |

## Copy

Search placeholder varies by tab (e.g. “Search frames…”).

## User stories

- [x] Four tabs with active styling
- [x] Product grid with SKU, price in SAR
- [x] Tap adds to cart when customer selected
- [x] Search/filter/barcode UI stubs
- [ ] Live catalog + brand API wired to grid

## Implementation

| File | Role |
|------|------|
| `product-catalog-card/product-catalog-card.component.*` | UI |
| `models/product.models.ts` | `Product`, `CatalogCategory` |
| `services/sell.mock-data.ts` | Mock products |
| `services/brand.service.ts` | `GetBrand` |
| `services/sell-session.store.ts` | `filteredProducts`, `addProductToCart()` |
