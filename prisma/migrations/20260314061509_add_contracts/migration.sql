-- CreateTable
CREATE TABLE "Contract" (
    "id" STRING NOT NULL,
    "companyId" STRING NOT NULL,
    "description" STRING NOT NULL,
    "reward" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "status" STRING NOT NULL DEFAULT 'ABERTO',
    "completedBy" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
