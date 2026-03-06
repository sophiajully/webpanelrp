-- CreateTable
CREATE TABLE "Queue" (
    "id" STRING NOT NULL,
    "taskName" STRING NOT NULL,
    "payload" STRING NOT NULL DEFAULT '{}',
    "status" STRING NOT NULL DEFAULT 'pending',
    "error" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Queue_pkey" PRIMARY KEY ("id")
);
