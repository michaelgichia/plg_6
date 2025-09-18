import {z} from 'zod'

export const signUpSchema = z
  .object({
    full_name: z
      .string()
      .min(2, {
        message: 'Name must be at least 2 characters.',
      })
      .max(50, {
        message: 'Name is too long',
      }),
    email: z.email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirm_password: z.string(),
    terms: z.literal(true, {
      message: 'You must agree to the terms',
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })

export type SignUpSchema = z.infer<typeof signUpSchema>
