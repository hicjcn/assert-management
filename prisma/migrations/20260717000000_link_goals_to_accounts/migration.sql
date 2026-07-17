-- Goal progress is now derived from live account balances instead of a manually
-- maintained snapshot. Existing goals keep their target and forecast fields;
-- goals without links automatically use the user's current net worth.
-- CreateTable
CREATE TABLE "goal_accounts" (
    "goal_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,

    CONSTRAINT "goal_accounts_pkey" PRIMARY KEY ("goal_id", "account_id")
);

-- CreateIndex
CREATE INDEX "goal_accounts_account_id_idx" ON "goal_accounts"("account_id");

-- AddForeignKey
ALTER TABLE "goal_accounts" ADD CONSTRAINT "goal_accounts_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_accounts" ADD CONSTRAINT "goal_accounts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "goals" DROP COLUMN "current_amount";
