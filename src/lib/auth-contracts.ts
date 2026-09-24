import { z } from "zod";

export const authSessionSchema = z.object({
  user: z.object({
    id: z.string().min(1),
    email: z.string().nullable(),
    name: z.string().nullable(),
    phone: z.string().nullable(),
    isEmailVerified: z.boolean(),
    isPhoneVerified: z.boolean(),
  }),
  session: z.object({ expiresAt: z.string().datetime() }),
});
export type AuthSession = z.infer<typeof authSessionSchema>;
export type LoginInput = { email: string; password: string };
export type SignupInput = LoginInput & { name?: string };
export type AuthOperation = "signup" | "login" | "logout" | "me";
export const authErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
export type AuthErrorBody = z.infer<typeof authErrorSchema>;
