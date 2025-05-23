import { Home, List, User, ChevronDown } from "lucide-react"

interface NavHeaderProps {
  onViewChange: (view: string) => void
  currentView: string
}

export default function NavigationHeader({ onViewChange, currentView }: NavHeaderProps) {
  const items = [
    {
      label: "Home",
      view: "home",
      icon: <Home className="w-4 h-4" />,
    },
    {
      label: "Orders by Status",
      view: "orders",
      icon: <List className="w-4 h-4" />,
    },
    {
      label: "Staff Workload",
      view: "workload",
      icon: <User className="w-4 h-4" />,
    },
  ]

  return (
    <nav className="w-full bg-zinc-900 text-white border-b border-zinc-800 px-6 py-2">
      <div className="flex gap-6 items-center">
        {items.map((item) => {
          const isActive = currentView === item.view
          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={`flex items-center gap-2 text-sm px-2 py-1 rounded-md transition font-medium ${
                isActive
                  ? "text-white font-semibold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {item.icon}
              {item.label}
              {item.view !== "home" && (
                <ChevronDown className="w-3 h-3 opacity-50 -ml-1" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
