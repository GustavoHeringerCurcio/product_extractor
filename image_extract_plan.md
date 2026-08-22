# Image Extract Plan — Real Photos from OLX

## Problem

The current "Fotos de referência" feature (`web/src/lib/serpapi.ts`) queries SerpAPI
Google Images **without a site filter**, so it returns professional/e-commerce product
shots (white background, manufacturer photos) instead of real seller photos.

Goal: show **real photos from OLX listings** (photos taken by actual sellers) in the
frontend.

## Research results (verified live)

- Adding `as_sitesearch=olx.com.br` to SerpAPI `google_images` returns **real OLX
  listing photos** — confirmed with the existing `SERPAPI_API_KEY`: 50 results, all
  with `source: "OLX"` and `is_product: false`.
  - `original` → `https://img.olx.com.br/images/62/629692888810031.jpg` (real user photo)
  - `link` → the OLX listing page (click-through to the original ad)
- `img.olx.com.br` CDN is **directly hotlinkable** (HTTP 200, no Cloudflare block), so
  we can render the full-res OLX image directly and avoid Google `gstatic` thumbnails
  (which can expire / hotlink-block).
- **Ruled out**: scraping `olx.com.br` search pages directly returns **HTTP 403
  (Cloudflare)** on a plain fetch. Doing it reliably would require Playwright +
  anti-bot/proxy infrastructure — not worth it for this feature.

## Chosen approach

1. `web/src/lib/serpapi.ts`
   - Add `as_sitesearch: "olx.com.br"` to the SerpAPI params.
   - Extend the `ReferencePhoto` type with `link` (OLX listing URL) and `isProduct`.
   - Filter to `is_product === false` (real photos, not catalog shots).
   - Use `original` (`img.olx.com.br`) as the display URL.
2. `web/src/app/api/photos/route.ts`
   - No signature change; new fields pass through.
3. `web/src/components/ReferencePhotos.tsx`
   - Render images from the OLX `original` URL with `loading="lazy"`.
   - Add a click-through link to the OLX listing (`link`).
   - Show an "OLX" source badge; update the disclaimer text.
4. **No new env vars** — reuses `SERPAPI_API_KEY`.
5. **Legal guardrail retained**: reference-only, no auto-cloning (copyright, OLX Regra 9,
   account-ban risk — see `dump/research.md §7.3`).
6. Verify with `npm run lint`, `npm run typecheck`, `npm run build` in `web/`.

## Files changed

- `image_extract_plan.md` (this doc)
- `web/src/lib/serpapi.ts`
- `web/src/components/ReferencePhotos.tsx`
