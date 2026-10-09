-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "color" TEXT,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "care" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "collection" TEXT NOT NULL DEFAULT 'Essentials',
ADD COLUMN     "composition" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "fit" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "popularity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "saleEndsAt" TIMESTAMP(3),
ADD COLUMN     "salePriceCents" INTEGER,
ADD COLUMN     "saleStartsAt" TIMESTAMP(3),
ADD COLUMN     "sample" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sizeChart" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "color" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "storageKey" TEXT,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "code" TEXT NOT NULL,
    "percent" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "minimumCents" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'store',
    "name" TEXT NOT NULL DEFAULT 'AUREO',
    "slogan" TEXT NOT NULL DEFAULT 'O essencial tem presença.',
    "announcement" TEXT NOT NULL DEFAULT 'Coleção 01 — Uma nova forma de vestir o cotidiano',
    "heroImage" TEXT NOT NULL DEFAULT '/images/editorial.jpg',
    "heroTitle" TEXT NOT NULL DEFAULT 'Menos excesso. Mais essência.',
    "accent" TEXT NOT NULL DEFAULT '#151515',
    "privacyDraft" TEXT NOT NULL DEFAULT 'Rascunho: definir responsável, contato, finalidades, prazos de retenção e canal para direitos dos titulares antes da publicação.',
    "shippingDraft" TEXT NOT NULL DEFAULT 'Rascunho: condições e prazos serão definidos após a integração com a transportadora. Não há entregas reais nesta demonstração.',
    "returnsDraft" TEXT NOT NULL DEFAULT 'Rascunho: publicar os procedimentos de trocas e devoluções após revisão jurídica e operacional.',
    "termsDraft" TEXT NOT NULL DEFAULT 'Rascunho: esta loja está em desenvolvimento. Produtos ilustrativos e pagamentos reais desativados.',

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribeToken" TEXT NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_active_stock_idx" ON "ProductVariant"("productId", "active", "stock");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_size_color_key" ON "ProductVariant"("productId", "size", "color");

-- CreateIndex
CREATE INDEX "ProductImage_productId_position_idx" ON "ProductImage"("productId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_unsubscribeToken_key" ON "NewsletterSubscriber"("unsubscribeToken");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
