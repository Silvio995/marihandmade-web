import { type ClassValue, clsx } from 'clsx'
import { NextResponse } from 'next/server'
import { twMerge } from 'tailwind-merge'
import { ZodError } from 'zod'

export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs))
}

export function formatDate(input: string | number): string {
   const date = new Date(input)
   return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
   })
}

export function absoluteUrl(path: string) {
   return `${process.env.NEXT_PUBLIC_APP_URL}${path}`
}

export function isVariableValid<T>(variable: T | null | undefined): variable is T {
   return variable !== null && variable !== undefined
}

export function validateBoolean(variable: unknown, value: boolean) {
   if (isVariableValid(variable) && variable === value) {
      return true
   }

   return false
}

export function isMacOs() {
   return window.navigator.userAgent.includes('Mac')
}

export function getErrorResponse(
   status: number = 500,
   message: string,
   errors: ZodError | null = null
) {
   console.error({ errors, status, message })

   return new NextResponse(
      JSON.stringify({
         status: status < 500 ? 'fail' : 'error',
         message,
         errors: errors ? errors.flatten() : null,
      }),
      {
         status,
         headers: { 'Content-Type': 'application/json' },
      }
   )
}
// src/lib/utils.ts
export const products = [
  { id: '1', name: 'Filato Cotone Naturale', image: '/hero/costume1.jpeg', price: 12.5 },
  { id: '2', name: 'Filato Lana Merino', image: '/hero/costume2.jpeg', price: 15 },
  { id: '3', name: 'Filato Acrilico Colorato', image: '/hero/2.jpeg', price: 8 },
];
