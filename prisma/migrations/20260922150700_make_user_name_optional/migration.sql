-- AlterTable: make user name nullable to support GitHub OAuth users without a display name
ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;
