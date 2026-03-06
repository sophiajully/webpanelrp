-- CreateTable
CREATE TABLE "User" (
    "id" STRING NOT NULL,
    "username" STRING NOT NULL,
    "password" STRING NOT NULL,
    "isOwner" BOOL NOT NULL DEFAULT false,
    "accessKey" STRING,
    "expiresAt" TIMESTAMP(3),
    "companyId" STRING,
    "roleId" STRING,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "ownerId" STRING NOT NULL,
    "webhookVendas" STRING,
    "webhookLogs" STRING,
    "colorPrimary" STRING NOT NULL DEFAULT '#8b0000',
    "colorAccent" STRING NOT NULL DEFAULT '#ff4c4c',

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "companyId" STRING NOT NULL,
    "canVendas" BOOL NOT NULL DEFAULT true,
    "canCraft" BOOL NOT NULL DEFAULT true,
    "canLogs" BOOL NOT NULL DEFAULT false,
    "canAdmin" BOOL NOT NULL DEFAULT false,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HireRequest" (
    "id" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "companyId" STRING NOT NULL,
    "status" STRING NOT NULL DEFAULT 'pending',

    CONSTRAINT "HireRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Company_ownerId_key" ON "Company"("ownerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HireRequest" ADD CONSTRAINT "HireRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HireRequest" ADD CONSTRAINT "HireRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
