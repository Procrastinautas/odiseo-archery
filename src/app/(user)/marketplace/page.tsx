import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import Link from 'next/link'
import { Plus, Store } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  bow: 'Arco',
  arrows: 'Flechas',
  accessory: 'Accesorio',
  other: 'Otro',
}

export default async function MarketplacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: posts } = await supabase
    .from('marketplace_posts')
    .select('*, profiles(name, picture_url)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Mercado"
        action={
          <Link href="/marketplace/new" className={buttonVariants({ size: 'sm' })}>
            <Plus className="h-4 w-4 mr-1" />
            Publicar
          </Link>
        }
      />

      <div className="p-4">
        {posts?.length ? (
          <div className="grid grid-cols-2 gap-3">
            {posts.map((post) => {
              const images = Array.isArray(post.images) ? post.images : []
              const firstImage = images[0] as string | undefined

              return (
                <Link key={post.id} href={`/marketplace/${post.id}`}>
                  <Card className="overflow-hidden hover:bg-accent/30 transition-colors">
                    <div className="aspect-square bg-muted flex items-center justify-center">
                      {firstImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={firstImage}
                          alt={post.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Store className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <CardContent className="p-2.5 space-y-1">
                      <p className="text-sm font-medium line-clamp-2 leading-tight">{post.title}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_LABELS[post.category]}
                        </Badge>
                        {post.price != null && (
                          <span className="text-sm font-semibold">
                            ${post.price.toLocaleString('es-CO')}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <Store className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No hay publicaciones activas</p>
              <Link href="/marketplace/new" className={buttonVariants({ size: 'sm' })}>
                <Plus className="mr-1.5 h-4 w-4" />
                Publicar equipos
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
