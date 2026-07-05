-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY');

-- CreateEnum
CREATE TYPE "AccountCategory" AS ENUM ('CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'VIRTUAL_ACCOUNT', 'INVESTMENT', 'LIABILITY_ACCOUNT', 'BOND');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('INITIAL', 'INCREASE', 'DECREASE', 'SET', 'CORRECTION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AccountCategory" NOT NULL,
    "account_type" "AccountType" NOT NULL,
    "icon_key" VARCHAR(64),
    "current_amount" BIGINT NOT NULL DEFAULT 0,
    "include_in_stats" BOOLEAN NOT NULL DEFAULT true,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_changes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "account_name_snapshot" TEXT NOT NULL,
    "category_snapshot" "AccountCategory" NOT NULL,
    "change_type" "ChangeType" NOT NULL,
    "before_amount" BIGINT NOT NULL,
    "change_amount" BIGINT NOT NULL,
    "after_amount" BIGINT NOT NULL,
    "note" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target_amount" BIGINT NOT NULL,
    "current_amount" BIGINT NOT NULL DEFAULT 0,
    "one_time_income" BIGINT NOT NULL DEFAULT 0,
    "one_time_expense" BIGINT NOT NULL DEFAULT 0,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE INDEX "accounts_category_idx" ON "accounts"("category");

-- CreateIndex
CREATE INDEX "accounts_archived_idx" ON "accounts"("archived");

-- CreateIndex
CREATE INDEX "account_changes_user_id_changed_at_idx" ON "account_changes"("user_id", "changed_at");

-- CreateIndex
CREATE INDEX "account_changes_account_id_idx" ON "account_changes"("account_id");

-- CreateIndex
CREATE INDEX "account_changes_change_type_idx" ON "account_changes"("change_type");

-- CreateIndex
CREATE INDEX "goals_user_id_idx" ON "goals"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_user_id_key_key" ON "settings"("user_id", "key");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_changes" ADD CONSTRAINT "account_changes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_changes" ADD CONSTRAINT "account_changes_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

