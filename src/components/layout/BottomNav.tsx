'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Target, BarChart2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/sessions', label: 'Sesiones', icon: Calendar },
  { href: '/training', label: 'Entreno', icon: Target },
  { href: '/stats', label: 'Estadísticas', icon: BarChart2 },
  { href: '/profile', label: 'Perfil', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <Icon
                className={cn('h-5 w-5', active && 'stroke-[2.5]')}
                strokeWidth={active ? 2.5 : 1.5}
              />
              <span className={cn('font-medium', active && 'font-semibold')}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
