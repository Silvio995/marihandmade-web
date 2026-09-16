import OrderEmail from '@/emails/order_notification_owner'
import { sendEmail } from '@/lib/resend'
import type { OrderWithIncludes } from '@/types/prisma'

type OrderEmailPayload = Pick<OrderWithIncludes, 'id' | 'payable'> & {
   email: string
   number?: number
   tag?: string
   subject?: string
}

export async function sendOrderEmail(order: OrderEmailPayload) {
  return sendEmail({
      tag: order.tag ?? 'order-confirmation',
      to: order.email,
      subject: order.subject ?? 'Order confirmation',
      react: OrderEmail({
         orderNum: order.number?.toString(),
         payable: order.payable?.toString(),
         id: order.id,
      }),
   })
}

type OwnerOrderEmailPayload = Pick<OrderWithIncludes, 'id' | 'payable'> & {
   email: string
   number: number
}

export async function sendOwnerOrderEmail(order: OwnerOrderEmailPayload) {
   return sendEmail({
      tag: 'order-owner-notification',
      to: order.email,
      subject: 'An order was created.',
      react: OrderEmail({
         orderNum: order.number.toString(),
         payable: order.payable?.toFixed(2),
         id: order.id,
      }),
   })
}

type SendOTPEmailArgs = {
   to: string
   subject: string
   html: string
}

export async function sendOTPEmail({ to, subject, html }: SendOTPEmailArgs) {
   return sendEmail({
      tag: 'otp-email',
      to,
      subject,
      html,
   })
}
