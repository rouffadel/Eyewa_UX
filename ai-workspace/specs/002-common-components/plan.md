---
feature: common-components
status: in-progress
spec: ./spec.md
project: optical-pos
updated: 2026-06-18
depends_on: specs/001-staff-login
---

# Implementation plan — Common shell components

## Spec reference

- **Index:** [`spec.md`](./spec.md)
- **Component specs:**
  - [`components/app-header/spec.md`](./components/app-header/spec.md)
  - [`components/profile-page/spec.md`](./components/profile-page/spec.md)
  - [`components/bottom-nav/spec.md`](./components/bottom-nav/spec.md)
  - [`components/pos-shell/spec.md`](./components/pos-shell/spec.md)
- Visual reference: [`raw-knowledge/files/POSScreen.png`](../../raw-knowledge/files/POSScreen.png)

## Goal

Build **`AppHeaderComponent`** (tablet ERP header + store dropdown), **`ProfilePageComponent`**, **`BottomNavComponent`**, and compose in **`PosShellComponent`**.

## Technical approach

### File structure

```
optical-pos-angular-capacitor-ux/src/app/
├── styles.css                          # + POS shell tokens (see index spec)
├── shared/ui/
│   ├── app-header/
│   └── bottom-nav/
└── features/pos/
    ├── profile/
    └── shell/
        ├── pos-shell.component.ts
        └── pos-shell.component.css
```

### Phased delivery

| Phase | Spec | Scope | Status |
|-------|------|--------|--------|
| **1** | [bottom-nav](./components/bottom-nav/spec.md) | Tokens + five-tab bar | **Done** |
| **2** | [app-header](./components/app-header/spec.md) | Tablet ERP header + store dropdown | **Done** |
| **3** | [profile-page](./components/profile-page/spec.md) | Standalone profile route | **Done** |
| **4** | [pos-shell](./components/pos-shell/spec.md) | Compose header + outlet + nav | **Done** |

## Test strategy

- Header: layout, store dropdown, `newCustomer` / `profileClick` outputs
- Profile: sign out, back navigation
- Bottom nav: active tab styling, `tabChange` emit
- Shell: chrome hidden on `profile` and `createcustomer` routes

## Definition of done

- [x] All four component specs implemented
- [x] Index spec rollup status current
- [x] Unit tests for header, nav, shell
