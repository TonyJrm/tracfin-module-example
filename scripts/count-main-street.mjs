import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();
const count = await prisma.players.count({
  where: { address_street: { contains: "Main Street", mode: "insensitive" } },
});
console.log("Players on Main Street:", count);
await prisma.$disconnect();
