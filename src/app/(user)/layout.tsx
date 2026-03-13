import { BottomNav } from '@/components/layout/BottomNav'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-svh">
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
    </div>
  )
}
