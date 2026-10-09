ALTER TABLE "ProductVariant" ADD CONSTRAINT "variant_stock_nonnegative" CHECK ("stock" >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "fashion_price_valid" CHECK ("priceCents" >= 0 AND ("salePriceCents" IS NULL OR ("salePriceCents" > 0 AND "salePriceCents" < "priceCents")));
ALTER TABLE "Coupon" ADD CONSTRAINT "coupon_percent_valid" CHECK ("percent" > 0 AND "percent" <= 100 AND "minimumCents" >= 0);
CREATE INDEX "Product_categoryId_archived_createdAt_idx" ON "Product"("categoryId", "archived", "createdAt");
