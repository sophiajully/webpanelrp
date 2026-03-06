-- CreateTable
CREATE TABLE "AccessKey" (
    "id" STRING NOT NULL,
    "key" STRING NOT NULL,
    "days" INT4 NOT NULL DEFAULT 30,
    "used" BOOL NOT NULL DEFAULT false,
    "usedBy" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessKey_key_key" ON "AccessKey"("key");
