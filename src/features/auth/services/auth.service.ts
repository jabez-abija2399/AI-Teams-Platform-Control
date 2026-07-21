import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema, type RegisterInput } from '@/features/auth/schemas/auth.schema';
import type { ApiResult } from '@/types/common.types';

export async function registerUser(input: RegisterInput): Promise<ApiResult<{ id: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid input',
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return {
      success: false,
      error: {
        message: 'An account with this email already exists',
        code: 'EMAIL_TAKEN',
      },
    };
  }

  const hashed = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashed,
    },
  });

  return { success: true, data: { id: user.id } };
}
