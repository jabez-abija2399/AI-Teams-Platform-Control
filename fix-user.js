const { PrismaClient } = require('./prisma/generated/prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fixUser() {
  const hashedPassword = await bcrypt.hash('Abija@2399', 10);
  
  await prisma.user.upsert({
    where: { email: 'abi@gmail.com' },
    update: { password: hashedPassword },
    create: {
      name: 'Demo User',
      email: 'abi@gmail.com',
      password: hashedPassword
    }
  });

  console.log('✅ Password set for abi@gmail.com to: Abija@2399');
}

fixUser().catch(console.error).finally(() => prisma.$disconnect());
