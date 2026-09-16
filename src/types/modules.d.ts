declare module '@persepolis/slugify' {
   export function slugify(str: string): string
}

declare module '@persepolis/mail' {
   export function sendMail(args: {
      name: string
      to: string
      subject: string
      html: string
   }): Promise<unknown>

   export function getTransporter(): Promise<unknown>
}

declare module '@persepolis/regex' {
   export function isEmailValid(email: string): boolean
   export function isPhoneNumberValid(phoneNumber: string): boolean
   export function isIranianPhoneNumberValid(phoneNumber: string): boolean
}

declare module '@persepolis/sms' {
   export function sendBulkSMS(args: {
      Mobiles: string[]
      MessageText: string
   }): Promise<unknown>

   export function sendLikeToLikeSMS(args: {
      Mobiles: string[]
      MessageText: string
   }): Promise<unknown>

   export function sendTransactionalSMS(args: {
      Mobile: string
      TemplateId: string | number
      Parameters: unknown
   }): Promise<unknown>
}

declare module 'resend' {
   export class Resend {
      constructor(apiKey?: string)
      emails: {
         send(input: {
            from: string
            to: string | string[]
            subject: string
            react?: unknown
            html?: string
            text?: string
         }): Promise<unknown>
      }
   }
}
