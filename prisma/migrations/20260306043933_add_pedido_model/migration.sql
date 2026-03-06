-- CreateTable
CREATE TABLE "Pedido" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "pombo" STRING NOT NULL,
    "companyId" STRING NOT NULL,
    "produtos" STRING NOT NULL DEFAULT '[]',

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
