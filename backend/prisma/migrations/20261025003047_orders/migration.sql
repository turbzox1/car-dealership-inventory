-- Orders group purchase lines: a cart checkout is one order with several lines,
-- a single "Purchase" click is an order with one line.
-- Hand-edited so it is safe on databases that already contain purchases.

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- Add the column as nullable first so existing rows can be backfilled
ALTER TABLE "Purchase" ADD COLUMN "orderId" TEXT;

-- Backfill: every existing purchase becomes its own one-line order.
-- Reusing the purchase id as the order id keeps the mapping trivial.
INSERT INTO "Order" ("id", "userId", "createdAt")
SELECT "id", "userId", "purchasedAt" FROM "Purchase";

UPDATE "Purchase" SET "orderId" = "id";

ALTER TABLE "Purchase" ALTER COLUMN "orderId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Purchase_orderId_idx" ON "Purchase"("orderId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
