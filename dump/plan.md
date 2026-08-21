# Implementation Plan — AliExpress → Marketplace Ad Helper

## 1. Goals (locked in)

- Paste/drop **AliExpress screenshots** (single or bulk) → identify product via **GPT‑4o mini (vision)**.
- Output per product: **5 title recommendations** (pick one), **1 pt-BR description**, **medium price (BRL)** and **sell price = medium + R$50**.
- **Copy/paste everywhere**: paste images in (`Ctrl+V`/drag-drop/picker); copy titles/description out (clipboard buttons).
- **"Meus produtos"** sidebar route (single user, no login).
- **Fotos reais de referência** via **SerpAPI Google Images** (compliant; never auto-clone others' photos).
- **PostgreSQL** via docker-compose.

## 2. Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | React + Tailwind CSS (+ shadcn/ui for polish) |
| AI | **Vercel AI SDK** `generateObject` + `@ai-sdk/openai`, model `gpt-4o-mini` |
| Validation | Zod (Structured Outputs JSON schema) |
| DB | Prisma + PostgreSQL 16 (docker-compose) |
| Reference photos | SerpAPI `google_images` engine |
| Clipboard | Native `ClipboardEvent` (paste in) + `navigator.clipboard` (copy out) |

## 3. Directory structure

```
products_extractor/
├── docker-compose.yml
├── .env.example
├── prisma/schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Sidebar (Meus produtos) + main
│   │   ├── page.tsx              # home: dropzone → results
│   │   ├── produtos/page.tsx     # Meus produtos list
│   │   ├── produtos/[id]/page.tsx# detail / edit / re-copy
│   │   └── api/
│   │       ├── analyze/route.ts  # POST images → AI result
│   │       ├── products/route.ts # GET list, POST save
│   │       ├── products/[id]/route.ts # GET/PATCH/DELETE
│   │       └── photos/route.ts   # GET reference photos (SerpAPI)
│   ├── components/
│   │   ├── Dropzone.tsx          # drag-drop + paste + picker
│   │   ├── ProductResult.tsx     # 5 titles + description + copy
│   │   ├── Sidebar.tsx
│   │   └── PricePanel.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── ai.ts                 # generateObject config + prompt
│   │   ├── schema.ts             # zod schema
│   │   ├── serpapi.ts
│   │   └── pricing.ts            # FX + "+R$50" (pure, unit-tested)
│   └── types/
└── package.json
```

## 4. Data model (Prisma — single user)

```prisma
model Product {
  id             String   @id @default(cuid())
  productName    String
  category       String?
  specs          Json?              // string[]
  aliPrice       Float?
  currency       String?            // "USD" | "CNY" | "BRL"
  mediumPriceBrl Float?
  sellPriceBrl   Float?
  titles         Json               // string[5]
  description    String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model Setting {
  key   String @id                 // e.g. "FX_USD_BRL"
  value String
}
```

FX rates live in `Setting` (editable in UI), with `.env` defaults as fallback.

## 5. AI pipeline (`POST /api/analyze`)

1. Accept `multipart/form-data` (multiple files). Cap: e.g. 10 images / 5 MB each.
2. Convert each to base64 `data:image/...;base64,...`, `detail: "high"`.
3. `generateObject` → Zod schema:

```ts
const resultSchema = z.object({
  product_name: z.string(),
  category: z.string(),
  specs: z.array(z.string()),
  price: z.object({ amount: z.number(), currency: z.enum(["USD","CNY","BRL"]) }).nullable(),
  medium_price_brl: z.number(),
  titles: z.array(z.string()).length(5),
  description: z.string(),
});
```

4. **Sell price computed in code** (not by model) for determinism:
   `sellPriceBrl = round(medium_price_brl + 50, .90)`.
5. Prompt (pt-BR, structured): identify product, read price + currency, estimate
   medium BRL price using configured FX, write 5 titles following OLX/Marketplace
   conventions (no "vendo"/"compro"/"oportunidade"/símbolos), 1 description with
   specs + reasons to buy, no links/e-mails.
6. Process bulk with bounded concurrency (e.g. `p-limit` 3) + progress events to
   the client.
7. Fallback to raw OpenAI Responses API if AI SDK image-part friction arises.

## 6. Pricing logic (`lib/pricing.ts`)

- `toBrl(amount, currency)` using `Setting` FX rates (editable).
- `sellPrice(medium) = roundTo90(medium + 50)`.
- Edge cases: price range → midpoint; missing price → model estimate + "edit me" flag.
- **Unit tests** (vitest) for `roundTo90` and the +50 invariant.

## 7. Clipboard UX

- **In:** window `onPaste` → iterate `clipboardData.items` where
  `type.startsWith("image/")` → `getAsFile()` → append to queue. Plus drag-drop
  + `<input type="file" multiple>`.
- **Out:** every title row + description has a copy button
  (`navigator.clipboard.writeText`) with a success toast; "copy all" for
  description + chosen title.

## 8. Reference photos (`GET /api/photos?q=...`)

- SerpAPI: `engine=google_images`, `q=product_name`, `hl=pt-BR`, `gl=br`,
  `imgsz=large`, optional `licenses`.
- Return `images_results[].{original, thumbnail, source, title}`; render a
  thumbnail grid; click → open `original` in new tab (reference only).
- **No auto-attach / no cloning** — documented legal guardrail (copyright, OLX
  Regra 9, Meta ToS).

## 9. docker-compose

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: products_extractor
    ports: ["5432:5432"]
    volumes: [ "pgdata:/var/lib/postgresql/data" ]
volumes:
  pgdata:
```

## 10. Env vars (`.env.example`)

```
OPENAI_API_KEY=
SERPAPI_API_KEY=
DATABASE_URL=postgresql://app:app@localhost:5432/products_extractor
FX_USD_BRL=5.20
FX_CNY_BRL=0.70
```

## 11. Milestones (each with acceptance criteria)

| # | Milestone | Acceptance |
|---|-----------|------------|
| M0 | Scaffold: Next.js + TS + Tailwind + docker-compose + Prisma migrate | `docker compose up` + `npm run dev` works |
| M1 | Single screenshot → result card (5 titles, 1 description, prices) | One paste yields correct pt-BR output |
| M2 | Bulk + progress + paste/drag-drop UX | Multiple images, bounded concurrency, progress bar |
| M3 | Save / "Meus produtos" (list, detail, edit, delete) | Products persist in Postgres, reloadable |
| M4 | Copy-to-clipboard polish (all rows + toast) | One-click copy of any title/description |
| M5 | Reference photos (SerpAPI) — read-only thumbnails | Search returns real comparable images |
| M6 | Hardening: error states, rate limits, validation, pt-BR UI, `lint`+`build`+tests green | Full happy-path demo |

## 12. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| AliExpress watermark/logo degrades price OCR | `detail:"high"`, crop price area pre-send, always let user edit price |
| Price/FX inaccuracy | Editable FX in UI; price flagged "verify" when low-confidence |
| AI output non-determinism | Structured Outputs (strict JSON), prices computed in code |
| SerpAPI cost | Optional feature; cache results; monthly cap |
| Legal (cloning photos) | Reference-only mode; prominent disclaimer in UI |
| Vision rate limits | Bounded concurrency + retry/backoff |

## 13. Assumptions

- UI in pt-BR.
- Tailwind CSS + shadcn/ui.
- vitest for pricing unit tests.
- `p-limit` for bounded concurrency.
