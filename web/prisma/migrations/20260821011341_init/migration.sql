-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT,
    "specs" JSONB,
    "aliPrice" DOUBLE PRECISION,
    "currency" TEXT,
    "mediumPriceBrl" DOUBLE PRECISION,
    "sellPriceBrl" DOUBLE PRECISION,
    "titles" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);
