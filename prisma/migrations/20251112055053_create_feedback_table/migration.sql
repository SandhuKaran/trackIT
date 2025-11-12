/*
  Warnings:

  - You are about to drop the column `feedback` on the `Visit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Visit" DROP COLUMN "feedback";

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_visitId_key" ON "Feedback"("visitId");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
