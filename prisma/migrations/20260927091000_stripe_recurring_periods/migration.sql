-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "providerSubscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_providerSubscriptionId_key" ON "Subscription"("providerSubscriptionId");
