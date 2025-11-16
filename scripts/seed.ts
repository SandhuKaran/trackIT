import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed script...");

  // ───────────────────────────────────────────────────────────
  // 1  Create / update the two users with hashed passwords
  // ───────────────────────────────────────────────────────────
  console.log("Hashing passwords...");
  const karanHash = await bcrypt.hash("karan", 10);
  const aliceHash = await bcrypt.hash("alice", 10);
  const crewHash = await bcrypt.hash("crewsecret", 10);

  console.log("Creating users...");
  const karan = await prisma.user.upsert({
    where: { email: "karan@example.com" },
    update: { name: "Karan" },
    create: {
      email: "karan@example.com",
      password: karanHash,
      name: "Karan",
    },
  });
  console.log("Created karan:", karan);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: { name: "Alice" },
    create: {
      email: "alice@example.com",
      password: aliceHash,
      name: "Alice",
    },
  });
  console.log("Created alice:", alice);

  const crew = await prisma.user.upsert({
    where: { email: "crew@company.com" },
    update: { name: "Crew" },
    create: {
      email: "crew@company.com",
      password: crewHash,
      role: "EMPLOYEE",
      name: "Crew",
    },
  });
  console.log("Created crew:", crew);

  // ───────────────────────────────────────────────────────────
  // 2  Insert visit records for each user
  // ───────────────────────────────────────────────────────────
  console.log("Creating visits...");
  await prisma.visit.createMany({
    skipDuplicates: true,
    data: [
      {
        date: new Date("2025-05-13"),
        note: "Weekly grass cutting, hedge trim, edging. Signed by Alice",
        userId: karan.id,
      },
      {
        date: new Date("2025-05-25"),
        note: "Weed spray scheduled (weather permitting)",
        userId: karan.id,
      },
      {
        date: new Date("2025-05-14"),
        note: "Spring cleanup and lawn dethatching. Signed by Bob",
        userId: alice.id,
      },
      {
        date: new Date("2025-05-28"),
        note: "Mowing + light fertiliser application",
        userId: alice.id,
      },
    ],
  });
  console.log("Visits created.");
}

main()
  .then(async () => {
    console.log("✅ Seed script finished successfully.");
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error("❌ Error in seed script:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
