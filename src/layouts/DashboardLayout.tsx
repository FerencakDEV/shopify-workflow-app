import React, { ReactNode, useState } from "react"
import ContentHeader from "../components/ContentHeader"
import NavigationHeader from "../components/NavigationHeader"

type DashboardLayoutProps = {
  children: ReactNode
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [view, setView] = useState("home")

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col">
      <ContentHeader />
      <NavigationHeader onViewChange={setView} currentView={view} />
      <main className="flex-1 p-4 overflow-y-auto">{children}</main>
    </div>
  )
}

export default DashboardLayout
