-- AlterTable: convert titles (JSONB array) into a single title (TEXT)

ALTER TABLE "products" ADD COLUMN "title" TEXT;

UPDATE "products"
SET "title" = COALESCE(NULLIF("titles"->>0, ''), '')
WHERE "title" IS NULL;

ALTER TABLE "products" ALTER COLUMN "title" SET NOT NULL;

ALTER TABLE "products" DROP COLUMN "titles";
