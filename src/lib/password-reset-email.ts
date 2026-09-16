import { sendEmail } from '@/lib/resend'

type Args = {
  email: string
  token: string
}

export async function sendPasswordResetEmail({ email, token }: Args) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/reset/${token}`
  return sendEmail({
    tag: 'password-reset',
    to: email,
    subject: 'Reset your password',
    text: `Click the link to reset your password: ${resetUrl}`,
    throwOnFailure: true,
  })
}
