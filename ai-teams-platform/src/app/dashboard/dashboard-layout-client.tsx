'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'

export function DashboardLayoutClient({
  children,
  userName,
  userImage,
}: {
  children: React.ReactNode
  userName: string
  userImage?: string | null
}) {
  const pathname = usePathname()
  const isWorkspace = pathname.includes('/workspace')

  if (isWorkspace) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar userName={userName} userImage={userImage} />
        <main className="bg-muted/30 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
