import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email').transform((v) => v.toLowerCase()),
  password: passwordSchema,
});

export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name is too long'),
});

export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
