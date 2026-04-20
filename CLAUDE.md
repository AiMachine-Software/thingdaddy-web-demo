# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ThingDaddy Demo Web is a demo/prototype web app for universal thing (IoT asset) registration and management. It uses TanStack Start (SSR framework built on TanStack Router + Vite) with React 19, Tailwind CSS v4, and shadcn/ui components.

Authentication is fully mocked using localStorage (no real backend).

## Commands

- `pnpm dev` — Start dev server on port 3000
- `pnpm build` — Production build
- `pnpm test` — Run tests with Vitest (`vitest run`)
- `pnpm dlx shadcn@latest add <component>` — Add shadcn/ui components

## Architecture

**Framework:** TanStack Start (not Next.js). Routes are file-based under `src/routes/` using TanStack Router conventions. The route tree is auto-generated in `src/routeTree.gen.ts` — do not edit manually.

**Routing layout:**
- `src/routes/__root.tsx` — Root shell with navbar/footer for public pages
- `src/routes/_auth/route.tsx` — Authenticated layout with sidebar, breadcrumbs (wraps all `_auth/*` routes)
- `src/routes/index.tsx`, `login.tsx`, `register.tsx`, `search.tsx` — Public routes
- `src/routes/_auth/dashboard.tsx`, `create.tsx`, `list.tsx`, etc. — Protected routes
- `src/routes/demo/` — Demo/prototype routes (form, table examples)

**Feature modules** live in `src/features/<domain>/` with `pages/`, `components/`, `sections/`, `config/`, `interfaces/` subdirectories. Features: `home`, `create`, `dashboard`, `list`, `search`, `login`, `register`.

**UI components:**
- `src/components/ui/` — shadcn/ui components (new-york style, zinc base color)
- `src/components/animate-ui/` — Animated component variants from animate-ui registry
- `src/components/layouts/` — App shell components (navbar, sidebar, footer)

**Path aliases:** Both `#/*` and `@/*` map to `./src/*`. The codebase primarily uses `#/` imports.

**Styling:** Tailwind CSS v4 with `@theme inline` in `src/styles.css`. Custom CSS variables for a neutral light/dark theme (sea-ink, lagoon, sand, etc.) plus standard shadcn tokens. Dark mode via `.dark` class on `<html>`. Fonts: Manrope (sans), Fraunces (display titles).

**Auth:** `src/lib/auth.ts` — Mock auth using localStorage. Auth guard in `_auth/route.tsx` is currently commented out.

**Forms:** Uses `@tanstack/react-form` with Zod v4 validation.

**Tables:** Uses `@tanstack/react-table` with `@tanstack/match-sorter-utils` for filtering.

## Asset Registration Flow (Register a Thing) — `/create`

The registration wizard has **3 steps**. After step 1, the GS1 scheme is locked in. Step 2 form adapts to the chosen type. Step 3 auto-generates and previews the full identifier chain.

### Step 1: Choose Asset Type (4 types, all selectable)

User selects one of 4 asset type cards. Each type maps to a **fixed GS1 EPC scheme**:

| Asset Type        | GS1 Scheme | AI Codes       | EPC URI Prefix               | Use Case                        |
|-------------------|-----------|----------------|------------------------------|----------------------------------|
| Consumable        | SGTIN     | (01) + (21)    | `urn:epc:id:sgtin:...`       | Finished goods, FMCG, raw materials |
| Work in Progress  | CPI       | (8010) + (8011)| `urn:epc:id:cpi:...`         | Components being manufactured/assembled |
| Fixed Asset       | GIAI      | (8004)         | `urn:epc:id:giai:...`        | Durable equipment, tools, vehicles |
| Human Resource    | GSRN      | (8018)         | `urn:epc:id:gsrn:...`        | People identifiers, staff badges, access cards |

### Step 2: Registration Form (type-specific fields)

**Common fields (all types):**
- Organization ID — UUID of the org (from mock auth / seed)
- GS1 Company Prefix — 6–12 digit numeric prefix (org-level setting)
- Namespace — ThingDaddy namespace string
- Description — free text

**Type-specific fields:**
- **SGTIN (Consumable):** Indicator Digit (0–9), Item Reference (numeric), Serial Number (alphanumeric)
- **CPI (Work in Progress):** Component/Part Reference (alphanumeric, GS1 AI charset 39), Serial Number (numeric)
- **GIAI (Fixed Asset):** Individual Asset Reference (alphanumeric, GS1 AI charset 82)
- **GSRN (Human Resource):** Service Reference (numeric, fills to 10 digits with Company Prefix)

### Step 3: Identifier Chain Preview (auto-generated, read-only)

After step 2, the system generates and displays the full 4-layer identifier chain:

1. **GS1 Element String** — AI code + raw data digits, e.g. `(01) 30117805001068 (21) 7654`
2. **EPC Pure Identity URI** — `urn:epc:id:sgtin:CompanyPrefix.ItemRefAndIndicator.SerialNumber`
3. **EPC Tag URI** — adds tag size + filter: `urn:epc:tag:sgtin-198:FilterValue.CompanyPrefix.ItemRef.Serial`
4. **RFID Tag EPC Memory Bank (hex)** — binary encoding per GS1 TDS spec, displayed as hexadecimal string

Plus the platform's own identifiers:
- **ThingDaddy URN** — `urn:thingdaddy:namespace:assetType:instance`
- **ThingDaddy CPI ref** — `urn:thingdaddy:cpi:CPI-{ORG}-{TYPE}-{SEQ}`

### GS1 Encoding Rules

- Company Prefix: 6–12 digits only. TDS supports this range for EPC tag encoding.
- Check Digit: GS1 modulo-10 algorithm. Required for GTIN (in SGTIN) but NOT for GIAI, GSRN, or CPI.
- SGTIN partition: determined by Company Prefix length (6 digits → partition 6, 12 digits → partition 0).
- Binary encoding: follows GS1 EPC TDS 1.11 — header byte + partition bits + variable fields.
- Tag sizes: SGTIN-96 / SGTIN-198, GIAI-96 / GIAI-202, CPI-96 / CPI-var, GSRN-96.
- Filter Value: default 0 ("all others").

### Sidebar Navigation (authenticated layout)

- Dashboard
- Things (expandable) → All Things, Register New
- Resolver
- Organizations (expandable)
- Transfers (expandable)
- Audit Logs
- Billing
- Reports
- Developer (expandable)

### Resolver Page — `/resolver`

Accepts any of: ThingDaddy URN, GS1 ID (GTIN/GIAI/SSCC/GLN), EPC URI, or QR code string. Resolves to the full thing record showing all identifier layers plus metadata. Has rotating placeholder examples and "Try:" sample links.

### Dashboard Page — `/dashboard`

- 4 stat cards: Total Things, Active, Suspended, Retired
- "Available Now" section: grid of quick-access cards (Register a Thing, Resolver, Things List, Organizations, Transfers, Verification, Audit Logs, API Keys, Webhooks, Billing)

### Billing Page — `/billing`

- Current Usage: 3 metric cards (Things count, Resolutions count, API Calls count) with progress bars and date ranges
- Plans section: 3 plan cards (Free $0, Starter $49, Scale $199) with feature lists and Subscribe buttons
