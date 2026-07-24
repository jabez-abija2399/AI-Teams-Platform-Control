const { PrismaClient } = require('./prisma/generated/prisma/client');
const prisma = new PrismaClient();
async function run() {
  const files = await prisma.file.findMany({ where: { path: 'tsconfig.json' } });
  for (const file of files) {
    if (file.content.includes('"increment": true') || file.content.includes('"increment":true')) {
      console.log('Found in file ID:', file.id);
      
      const newContent = file.content.replace(/"increment"\s*:\s*true/g, '"incremental": true');
      await prisma.file.update({ where: { id: file.id }, data: { content: newContent } });
      console.log('Fixed file ID:', file.id);
    }
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
