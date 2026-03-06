-- CreateTable
CREATE TABLE "Craft" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "unit" STRING NOT NULL,
    "companyId" STRING NOT NULL,
    "insumos" STRING NOT NULL DEFAULT '[]',

    CONSTRAINT "Craft_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Craft" ADD CONSTRAINT "Craft_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
