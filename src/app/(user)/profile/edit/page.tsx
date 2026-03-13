import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProfileInfoSection } from '@/components/profile/ProfileInfoSection'
import { BowsSection } from '@/components/profile/BowsSection'
import { ArrowsSection } from '@/components/profile/ArrowsSection'
import type { Database } from '@/types/database'

type ScopeMark = Database['public']['Tables']['scope_marks']['Row']
type Bow = Database['public']['Tables']['bows']['Row']

interface BowWithMarks extends Bow {
  scope_marks: ScopeMark[]
}

export default async function ProfileEditPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: bows }, { data: arrows }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('bows').select('*, scope_marks(*)').eq('user_id', user.id).order('created_at'),
    supabase.from('arrows').select('*').eq('user_id', user.id).order('created_at'),
  ])

  if (!profile) redirect('/onboarding')

  const typedBows: BowWithMarks[] = (bows ?? []).map((b) => ({
    ...b,
    scope_marks: (b.scope_marks as unknown as ScopeMark[]) ?? [],
  }))

  return (
    <div className="flex flex-col">
      <PageHeader title="Editar perfil" backHref="/profile" />
      <div className="flex flex-col gap-4 p-4 pb-24">
        <ProfileInfoSection
          uid={user.id}
          name={profile.name}
          pictureUrl={profile.picture_url}
        />
        <BowsSection initialBows={typedBows} />
        <ArrowsSection initialArrows={arrows ?? []} />
      </div>
    </div>
  )
}
