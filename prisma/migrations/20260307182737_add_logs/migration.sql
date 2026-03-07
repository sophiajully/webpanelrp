-- CreateTable
CREATE TABLE "CompanyLog" (
    "id" STRING NOT NULL,
    "companyId" STRING NOT NULL,
    "userId" STRING,
    "action" STRING NOT NULL,
    "details" STRING NOT NULL,
    "category" STRING NOT NULL DEFAULT 'GERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyLog_companyId_idx" ON "CompanyLog"("companyId");

-- AddForeignKey
ALTER TABLE "CompanyLog" ADD CONSTRAINT "CompanyLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyLog" ADD CONSTRAINT "CompanyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
