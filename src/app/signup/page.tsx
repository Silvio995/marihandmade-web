import { Metadata } from 'next'
import Link from 'next/link'
import SignupForm from './components/signup-form'

export const metadata: Metadata = {
  title: 'Sign up',
  description: 'Create your account',
}

export default function SignupPage() {
  return (
    <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden bg-zinc-900 h-full flex-col bg-muted p-10 dark:border-r lg:flex">
        <Link href="/" className="relative z-20 flex items-center text-lg font-medium">
          {`Marì Atelier`}
        </Link>
      </div>
      <div className="p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
            <p className="text-sm text-muted-foreground">Sign up with email and password.</p>
          </div>
          <SignupForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
