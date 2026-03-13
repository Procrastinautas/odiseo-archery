import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  backHref?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, backHref, action, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background px-4',
        className
      )}
    >
      {backHref && (
        <Link
          href={backHref}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      )}
      <h1 className="flex-1 text-base font-semibold truncate">{title}</h1>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </header>
  )
}
