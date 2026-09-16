import { getServerAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ProfileForm from './components/server-profile-form'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await getServerAuthSession()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      phone: true,
      email: true,
    },
  })

  return (
    <div className="max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Profilo</h1>
      <ProfileForm initialData={user} />
    </div>
  )
}
