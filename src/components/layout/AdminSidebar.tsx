'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Target,
  Store,
  Bell,
  Settings,
  ChevronRight,
  Dumbbell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const navGroups = [
  {
    label: 'General',
    items: [
      { href: '/admin', label: 'Panel', icon: LayoutDashboard, exact: true },
      { href: '/admin/users', label: 'Usuarios', icon: Users },
    ],
  },
  {
    label: 'Sesiones',
    items: [
      { href: '/admin/sessions', label: 'Sesiones', icon: Calendar },
    ],
  },
  {
    label: 'Planes',
    items: [
      { href: '/admin/plans/warmup', label: 'Calentamiento', icon: Dumbbell },
      { href: '/admin/plans/stretching', label: 'Estiramiento', icon: Dumbbell },
    ],
  },
  {
    label: 'Otros',
    items: [
      { href: '/admin/marketplace', label: 'Mercado', icon: Store },
      { href: '/admin/notifications', label: 'Notificaciones', icon: Bell },
    ],
  },
  {
    label: 'Configuración',
    items: [
      { href: '/admin/settings/banking', label: 'Datos bancarios', icon: Settings },
      { href: '/admin/settings/locations', label: 'Sede', icon: Settings },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-background">
      <div className="flex h-14 items-center px-4 font-semibold text-base">
        Odiseo — Admin
      </div>
      <Separator />
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              {group.label}
            </p>
            {group.items.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors',
                    active
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight className="h-3 w-3" />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
