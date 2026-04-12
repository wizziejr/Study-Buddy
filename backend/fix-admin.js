const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fixAdmin() {
  const username = 'Aqua_Slovic';
  const phone = '+265992393452';
  const password = 'Wizzie07?';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // First, try to find by phone
    const userByPhone = await prisma.user.findUnique({ where: { phone } });
    if (userByPhone) {
      const updated = await prisma.user.update({
        where: { id: userByPhone.id },
        data: {
          username: username, // Force username to admin username
          role: 'ADMIN',
          password: hashedPassword
        }
      });
      console.log('✅ Admin user updated via phone:', updated.username);
    } else {
      // Create new
      const user = await prisma.user.create({
        data: {
          username,
          phone,
          password: hashedPassword,
          role: 'ADMIN',
          level: 'ADMIN'
        }
      });
      console.log('✅ Admin user created:', user.username);
    }
  } catch (error) {
    console.error('❌ Error fixing admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmin();
