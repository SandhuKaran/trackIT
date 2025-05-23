import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// const prisma = new PrismaClient();

// async function main() {
//   const pwHash = await bcrypt.hash("secret123", 10);

//   const karan = await prisma.user.upsert({
//     where: { email: "karan@example.com" },
//     update: {},
//     create: { email: "karan@example.com", password: pwHash },
//   });

//   await prisma.visit.createMany({
//     data: [
//       {
//         date: new Date("2025-05-13"),
//         note: "Weekly grass cutting, hedge trim, edging. Signed by Alice",
//         userId: karan.id,
//       },
//       {
//         date: new Date("2025-05-25"),
//         note: "Weed spray scheduled (weather permitting)",
//         userId: karan.id,
//       },
//     ],
//   });
// }
// main().then(() => prisma.$disconnect());

const prisma = new PrismaClient();

async function main() {
  // ───────────────────────────────────────────────────────────
  // 1  Create / update the two users with hashed passwords
  // ───────────────────────────────────────────────────────────
  const karanHash = await bcrypt.hash("karan", 10);
  const aliceHash = await bcrypt.hash("alice", 10);

  const karan = await prisma.user.upsert({
    where: { email: "karan@example.com" },
    update: {},
    create: { email: "karan@example.com", password: karanHash },
  });

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: { email: "alice@example.com", password: aliceHash },
  });

  const crewHash = await bcrypt.hash("crewsecret", 10);
  await prisma.user.upsert({
    where: { email: "crew@company.com" },
    update: {},
    create: { email: "crew@company.com", password: crewHash, role: "EMPLOYEE" },
  });

  // ───────────────────────────────────────────────────────────
  // 2  Insert visit records for each user
  //    skipDuplicates avoids re-inserting if you run seed twice
  // ───────────────────────────────────────────────────────────
  await prisma.visit.createMany({
    skipDuplicates: true,
    data: [
      // Karan’s visits
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

      // Alice’s visits
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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
