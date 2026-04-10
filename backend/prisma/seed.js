const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Wizzie07?', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'Aqua_Slovic' },
    update: {},
    create: {
      username: 'Aqua_Slovic',
      phone: '+265992393452',
      email: 'admin@studybuddy.mw',
      password: adminPassword,
      role: 'ADMIN',
      points: 1000
    },
  });

  console.log({ admin });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
