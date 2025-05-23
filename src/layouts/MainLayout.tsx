// src/layouts/MainLayout.tsx
import { useState } from "react"
import ContentHeader from "../components/ContentHeader"
import NavigationHeader from "../components/NavigationHeader"
import Home from "../pages/Home"
import OrderByStatus from "../pages/OrderByStatus"
import StaffWorkload from "../pages/StaffWorkload"

export default function MainLayout() {
  const [view, setView] = useState("home")

  const renderView = () => {
    switch (view) {
      case "orders":
        return <OrderByStatus />
      case "workload":
        return <StaffWorkload />
      default:
        return <Home />
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <ContentHeader />
      <NavigationHeader onViewChange={setView} currentView={view} />
      <main className="flex-1 overflow-y-auto p-6">
        {renderView()}
      </main>
    </div>
  )
}
