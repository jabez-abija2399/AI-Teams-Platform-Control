// @ts-nocheck
import { PrismaClient } from '../prisma/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'jabezkifle9@gmail.com';
  const password = 'Abija@239';
  const name = 'Jabez Kifle';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('User already exists:', existing.id, existing.email, 'platformRole:', existing.platformRole);
    const hashedPassword = await bcrypt.hash(password, 12);
    const updated = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, platformRole: 'SUPER_ADMIN' as const },
    });
    console.log('Updated password for:', updated.email);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      platformRole: 'SUPER_ADMIN',
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: `${name}'s Organization`,
      slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-org`,
      ownerId: user.id,
      settings: {},
    },
  });

  console.log('Created superadmin user:', user.id, user.email, 'platformRole:', user.platformRole);
  console.log('Created organization:', org.id, org.name, 'ownerId:', org.ownerId);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
