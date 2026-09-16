import config from '@/config/site'
import { Button } from '@/components/ui/button'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
   title: 'Authentication',
   description: 'Authentication forms built using the components.',
}

export default function AuthenticationPage() {
   return (
      <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
         <div className="relative hidden bg-zinc-900 h-full flex-col bg-muted p-10 dark:border-r lg:flex">
            <Link
               href="/"
               className="relative z-20 flex items-center text-lg font-medium"
            >
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-6 w-6"
               >
                  <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
               </svg>
               {config.name}
            </Link>
            <div className="relative z-20 mt-auto">
               <blockquote className="space-y-2">
                  <p className="text-lg">
                     &ldquo;This library has saved me countless hours of work
                     and helped me deliver stunning designs to my clients faster
                     than ever before.&rdquo;
                  </p>
                  <footer className="text-sm">Sofia Davis</footer>
               </blockquote>
            </div>
         </div>
         <div className="p-8">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
               <div className="flex flex-col space-y-2 text-center">
                  <h1 className="text-2xl font-semibold tracking-tight">
                     Login
                  </h1>
                  <p className="text-sm text-muted-foreground">
                     Enter your email and password to access your account.
                  </p>
               </div>
               <LoginForm />
               <p className="px-8 text-center text-sm text-muted-foreground">
                  By clicking continue, you agree to our{' '}
                  <Link
                     href="/terms"
                     className="underline underline-offset-4 hover:text-primary"
                  >
                     Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                     href="/privacy"
                     className="underline underline-offset-4 hover:text-primary"
                  >
                     Privacy Policy
                  </Link>
                  .
               </p>
            </div>
         </div>
      </div>
   )
}

function LoginForm() {
   return (
      <form
         className="grid gap-4"
         action="/api/auth/signin"
         method="post"
      >
         <input type="hidden" name="callbackUrl" value="/" />
         <input type="hidden" name="provider" value="credentials" />
         <div className="grid gap-1">
            <label className="text-sm font-medium">Email</label>
            <input
               name="email"
               type="email"
               className="rounded-md border px-3 py-2 text-sm"
               required
            />
         </div>
         <div className="grid gap-1">
            <label className="text-sm font-medium">Password</label>
            <input
               name="password"
               type="password"
               className="rounded-md border px-3 py-2 text-sm"
               required
            />
         </div>
         <Button type="submit">Login</Button>
         <Link href="/signup" className="text-sm underline">
            Create an account
         </Link>
         <Link href="/reset" className="text-sm underline">
            Forgot password?
         </Link>
      </form>
   )
}
