import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6 print:p-0 print:bg-white">
          {children}
        </main>
      </div>
      <OnboardingProvider />
    </div>
  )
}
