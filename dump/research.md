# Research — AliExpress → Marketplace Ad Generator

> Research doc for a new **Next.js** project. Goal: the user pastes/shares an
> **AliExpress screenshot**, the app identifies the product with an OpenAI
> vision model and returns **title + description (pt-BR)** ready to post on
> **Facebook Marketplace** and **OLX**, plus a **recommended sell price in BRL**
> that is always **R$ 50 above the medium AliExpress price**.
>
> Scope of this doc: research only (no implementation plan).

---

## 1. Project overview

### 1.1 Vision

Make it as friendly as possible: the user only has to take screenshots from
AliExpress (in bulk), drop them into the app, and receive everything needed to
publish an ad on a Brazilian marketplace.

### 1.2 End-to-end user flow (target)

1. User opens the app and uploads one or more AliExpress screenshots (bulk).
2. For each screenshot, the app calls OpenAI (GPT‑4o mini, vision) to:
   - identify the product (name, category, key specs, what's in the image);
   - extract the displayed AliExpress price;
   - estimate a **medium market price in BRL**;
   - compute a **recommended sell price = medium price + R$ 50**.
3. The app returns:
   - a **title** (pt-BR) per marketplace (OLX + Facebook Marketplace);
   - a **description** (pt-BR) per marketplace;
   - the **recommended sell price in BRL**.
4. User can copy/edit the results and save the product to **"Meus produtos"**
   (a sidebar route), so they can recreate the ad later without re-analyzing
   the screenshot.

### 1.3 Critical feature

- **Real photos from OLX / Facebook Marketplace** to "clone" and create ads:
  the app should also be able to pull *real photos* of comparable listings
  (OLX / Facebook Marketplace) to help create ads. See §7 for approach and a
  **mandatory legal/policy risk warning**.

---

## 2. Functional requirements

| # | Requirement | Notes |
|---|-------------|-------|
| R1 | Accept AliExpress screenshots (single + bulk upload) | PNG/JPEG/WEBP |
| R2 | Identify the product in each image using an OpenAI vision model | GPT‑4o mini (user's choice) |
| R3 | Return suggested titles in pt-BR | Separate for OLX and Facebook Marketplace |
| R4 | Return suggested descriptions in pt-BR | Follow each marketplace's writing pattern |
| R5 | Estimate "medium price" in BRL | Read price from screenshot + editable FX rate |
| R6 | Recommend sell price = medium price + R$ 50 | Always |
| R7 | Save products to a "Meus produtos" route/sidebar | Single user, no login |
| R8 | Provide "real photos" of comparable listings | See §7 risk warning |
| R9 | PostgreSQL storage | Via Docker / docker-compose |

---

## 3. Tech stack (researched)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js (App Router)** | Full-stack; API routes for OpenAI calls |
| AI SDK | **Vercel AI SDK** (`generateObject`) | Typed, structured outputs, streaming, provider-agnostic |
| Model | **OpenAI GPT‑4o mini** (vision) | User choice; cheap; supports vision + JSON |
| Validation | **Zod** (JSON schema via Structured Outputs) | Guarantees deterministic output shape |
| Database | **PostgreSQL** | Via `docker-compose` |
| ORM | **Prisma** (or Drizzle) | Migrations, typed client |
| Upload | Local temp → base64 → OpenAI | No extra storage needed for MVP |
| Scraping (R8) | **Playwright / Puppeteer** | See §7 |

---

## 4. OpenAI vision research

Sources:
- <https://developers.openai.com/api/docs/guides/images-vision>
- <https://developers.openai.com/api/docs/pricing>
- <https://developers.openai.com/api/docs/models>

### 4.1 Model & pricing (GPT‑4o mini)

| Item | Value |
|------|-------|
| Input tokens | **$0.15 / 1M** |
| Output tokens | **$0.60 / 1M** |
| Cached input | $0.075 / 1M |
| Batch (50% off) | $0.075 in / $0.30 out |
| Vision | Supported (tile-based tokenization) |

### 4.2 Image input requirements

- Supported types: **PNG, JPEG, WEBP, non-animated GIF**.
- Pass via **base64 data URL** (`data:image/jpeg;base64,...`) or URL.
- Multiple images allowed per request.
- **⚠️ "No watermarks or logos"** is listed as a requirement. AliExpress
  screenshots *contain* logos/watermarks — this is not hard-blocked, but can
  degrade OCR of text/price. Recommend cropping the price area or sending the
  full image and validating the extracted price.

### 4.3 Tokenization (GPT‑4o mini — tile-based)

- `detail: "low"` → fixed **2833 base tokens** (cheap, but worse for small text).
- `detail: "high"` → 2833 base + **5667 tokens per 512px tile**.

**Cost estimate for a typical screenshot (1080×1080, high detail):**
scaled shortest side to 768px → 768×768 → `ceil(768/512)² = 4 tiles`
→ `2833 + 4 × 5667 ≈ 25.5k` input tokens ≈ **$0.0038** per image.
Output (~500 tokens) ≈ $0.0003. **Negligible per image.**

Use `detail: "high"` (or `auto`) because reading the **price (small text)**
benefits from higher fidelity. (`original` is not available on GPT‑4o mini.)

### 4.4 Structured Outputs (recommended)

Use the Responses API with a JSON schema so the model returns a deterministic
object. Example (Node/TS, Responses API):

```ts
import OpenAI from "openai";

const openai = new OpenAI();

const response = await openai.responses.create({
  model: "gpt-4o-mini",
  input: [
    {
      role: "user",
      content: [
        { type: "input_text", text: "<prompt em português>" },
        { type: "input_image", image_url: "data:image/jpeg;base64,...", detail: "high" },
      ],
    },
  ],
  text: {
    format: {
      type: "json_schema",
      name: "product_ad",
      strict: true,
      schema: { /* JSON Schema: product_name, category, specs, prices, titles, descriptions */ },
    },
  },
});

console.log(JSON.parse(response.output_text));
```

### 4.5 Model alternatives (cheaper)

GPT‑4o mini works, but these are cheaper if cost becomes a concern:

| Model | Input / 1M | Output / 1M |
|-------|-----------|-------------|
| gpt‑4.1‑mini | $0.40 | $1.60 |
| gpt‑4.1‑nano | $0.10 | $0.40 |
| gpt‑5‑nano | $0.05 | $0.40 |

Note: GPT‑4o mini remains a solid, supported choice for vision + JSON.

---

## 5. Marketplace content patterns (pt-BR)

### 5.1 OLX — rules & best practices

Source: <https://ajuda.olx.com.br/s/article/dicas-como-fazer-bom-anuncio>

**Título**
- Curto e direto: `nome do produto + estado de conservação`.
- **Proibido** conter palavras/símbolos sem relação: `"vendo"`, `"compro"`,
  `"oportunidade"`, `@#$%*`, etc.
- Buscas priorizam as **primeiras palavras** do título.

**Descrição**
- Descrever bem o produto com todas as informações; mostrar motivos de compra.
- **Proibido**: palavras de busca sem relação com o produto, **links e e-mails**.

**Imagens**
- Essenciais; nítidas; vários ângulos; anúncios com foto têm prioridade na busca.

**Preço**
- Valor total no campo "Preço"; parcelas na descrição; pontos/vírgulas são
  automáticos.

### 5.2 Facebook Marketplace (pt-BR)

> Note: the Facebook help pages are bot-blocked (HTTP 400 on `facebook.com/help/...`),
> so these are marketplace conventions to be validated during implementation.

- Título: objetivo, com marca/modelo + atributo-chave (ex.: `Smartwatch Amazfit Bip 3 Pro Preto`).
- Descrição: estado (novo/seminovo), motivo da venda, condição da caixa/acessórios,
  prazo de envio, forma de pagamento.
- Fotos reais do produto aumentam alcance; preço cheio no campo de preço.

### 5.3 Output example (pt-BR)

**OLX**
> Título: `Smartwatch Amazfit GTS 4 Preto - Novo na caixa`
> Descrição: `Smartwatch Amazfit GTS 4, preto, novo e lacrado na caixa. Tela AMOLED, GPS, monitoramento de saúde e bateria de longa duração. Acompanha carregador e manual. Faço entrega via OLX Pay. Qualquer dúvida, chama no chat.`

**Facebook Marketplace**
> Título: `Smartwatch Amazfit GTS 4 Preto`
> Descrição: `Novo na caixa, importado. Tela AMOLED 1,75", GPS integrado, mais de 150 modos esportivos e bateria que dura até 8 dias. Acompanha tudo da caixa. Envio imediato.`

---

## 6. Pricing logic (BRL + R$ 50)

1. **Read price from screenshot** — GPT‑4o mini reads the displayed price
   (note currency: USD or CNY on AliExpress).
2. **Convert to BRL** using a **configurable exchange rate** (manual setting in
   the app; optionally a free FX API later).
3. **Estimate "medium price"** — the typical/median market price in BRL for
   that product (model estimate, possibly adjusted by the price read).
4. **Recommended sell price = medium price + R$ 50** (always).

Edge cases:
- Screenshot shows a **price range** (e.g., variants) → use the midpoint/most
  common variant.
- Price missing/unreadable → fall back to model estimate + flag for user edit.
- "Medium price" should be a round BRL value (e.g., R$ 149,90).

---

## 7. Feature: "real photos" to clone ads — approach + RISK WARNING

### 7.1 What the user wants
Pull *real photos* of comparable listings from OLX / Facebook Marketplace so
the app can "clone" them to create ads.

### 7.2 Technical approach (for research reference)
- **Browser automation**: Playwright / Puppeteer to open OLX / Marketplace
  search results and download listing photos.
- **Proxies / rate limiting** to avoid IP blocks; parse listing JSON-LD where
  available.
- Store fetched photos temporarily; let user pick which to reuse.

### 7.3 ⚠️ LEGAL / POLICY RISK (must be surfaced to the user)

- **Copyright**: other sellers' photos are protected; reusing them is
  infringement.
- **OLX Regra 9 (Imagens)**: requires own, authentic photos of the product.
- **Facebook/Meta ToS**: prohibits scraping and unauthorized content reuse;
  scraping Marketplace violates Meta's terms.
- **Account bans**: both platforms ban accounts that reuse others' photos or
  scrape.

> **Recommendation (documented decision):** implement this feature **only as
> "reference/comparable listings"** (show real ads for inspiration on
> title/description/price) and **never auto-clone other sellers' photos** into
> the user's ad. Cloning photos carries account-ban + legal risk.

---

## 8. Data model considerations (light)

Single-user, no login. Suggested core entity:

- `products`: id, screenshot_url/blob, product_name, category, specs (jsonb),
  ali_price (numeric, currency), medium_price_brl (numeric), sell_price_brl
  (numeric), title_olx, description_olx, title_fb, description_fb, created_at.

---

## 9. Open questions / next steps

- Confirm Facebook Marketplace title/description conventions with a live sample.
- Decide FX rate source (manual vs API).
- Decide scraping scope for R8 (reference-only vs clone) — legal review.
- Validate GPT‑4o mini's price OCR quality on real AliExpress screenshots.

---

## 10. References

- OpenAI — Images and vision guide: <https://developers.openai.com/api/docs/guides/images-vision>
- OpenAI — API pricing: <https://developers.openai.com/api/docs/pricing>
- OpenAI — Models: <https://developers.openai.com/api/docs/models>
- Vercel AI SDK — overview: <https://ai-sdk.dev/docs/foundations/overview>
- OLX — Central de ajuda: <https://ajuda.olx.com.br/>
- OLX — Dicas para um bom anúncio: <https://ajuda.olx.com.br/s/article/dicas-como-fazer-bom-anuncio>
- OLX — Regras: <https://ajuda.olx.com.br/s/article/regras>
- Facebook Marketplace help (bot-blocked, HTTP 400): <https://www.facebook.com/help/marketplace>
