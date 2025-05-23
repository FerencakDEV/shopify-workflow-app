import { useEffect, useState } from "react"
import { ExternalLink, Search, ChevronDown } from "lucide-react"
import { Button } from "../components/ui/Button"

export default function ContentHeader() {
  const [time, setTime] = useState(new Date())
  const [apiStatus, setApiStatus] = useState<"live" | "error">("live")

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const checkAPI = async () => {
      try {
        // await fetch('/api/check')
        setApiStatus("live")
      } catch {
        setApiStatus("error")
      }
    }
    checkAPI()
  }, [])

  const formattedDate =
    time.toLocaleTimeString("sk-SK", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) +
    " " +
    time.toLocaleDateString("sk-SK", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })

  return (
    <header className="w-full flex items-center justify-between px-6 py-3 bg-zinc-900 border-b border-zinc-700 text-white">
      {/* LEFT: Nadpis + systémové info */}
      <div className="flex items-center gap-4">
        <h1 className="text-green-500 font-black text-xl">Reads WorkFlow</h1>

        <div className="flex items-center gap-2 text-sm bg-zinc-800 px-3 py-1.5 rounded-md text-gray-300">
          {formattedDate}
          <span className={apiStatus === "live" ? "text-green-400" : "text-red-400"}>
            • {apiStatus === "live" ? "Live" : "Error"}
          </span>
        </div>

        <a
          href="https://www.shopifystatus.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm bg-zinc-800 text-gray-300 px-3 py-1.5 rounded-md hover:underline"
        >
          Shopify status:
          <span className="text-green-400 font-medium flex items-center gap-1">
            ✔ Online <ExternalLink className="w-4 h-4 ml-1" />
          </span>
        </a>
      </div>

      {/* RIGHT: Search + Staff */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search order number.."
            className="pl-10 pr-4 py-1.5 rounded-md border border-zinc-700 bg-zinc-800 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const id = (e.target as HTMLInputElement).value
                if (id) {
                  window.location.href = `/orders/${id}`
                }
              }
            }}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        <button className="flex items-center gap-2 bg-zinc-800 text-sm text-white px-3 py-1.5 rounded-md hover:bg-zinc-700">
          <div className="w-6 h-6 rounded-full bg-zinc-600" />
          Staff <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
