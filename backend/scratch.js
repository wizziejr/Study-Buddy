const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Wizzie07?', 10);
  const user = await prisma.user.upsert({
    where: { username: 'Aqua_Slovic' },
    update: {
      password: hashedPassword,
      phone: '+265992393452',
      role: 'ADMIN'
    },
    create: {
      username: 'Aqua_Slovic',
      phone: '+265992393452',
      password: hashedPassword,
      role: 'ADMIN',
      level: 'Admin'
    }
  });
  console.log('Created admin user:', user.username);
}
main().catch(console.error).finally(() => prisma.$disconnect());
