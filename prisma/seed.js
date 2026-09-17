const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const email = "admin@portway.dev";
  const password = "Password123!";
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash },
    create: { email, name: "Admin User", passwordHash: hash },
  });
  console.log("Seeded user:", user.email);
}

main().finally(() => process.exit(0));

