// @ts-nocheck
import { PrismaClient } from '../prisma/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'jabezkifle9@gmail.com' },
    select: { id: true, email: true, name: true, platformRole: true, password: true }
  });

  console.log('User found:', !!user);
  if (user) {
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('PlatformRole:', user.platformRole);
    console.log('Has password:', !!user.password);
    console.log('Password length:', user.password?.length || 0);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
