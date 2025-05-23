import React from "react"
import { useNavigate } from "react-router-dom"

type StatusWidgetProps = {
  subtitle?: string
  title: string
  count?: number
  color?: string
  route?: string
}

const StatusWidget = ({
  title,
  subtitle,
  count = 0,
  color = "bg-zinc-700", // fallback farba
  route,
}: StatusWidgetProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (route) navigate(route)
  }

  const displayCount = isNaN(Number(count)) ? 0 : Number(count)

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer p-4 rounded-xl shadow hover:shadow-lg transition-all h-full flex items-center justify-between ${color} text-white hover:brightness-110`}
    >
      {/* Veľké číslo vľavo */}
      <div className="text-5xl font-extrabold w-1/3 text-center leading-none drop-shadow">
        {displayCount}
      </div>

      {/* Texty vpravo */}
      <div className="w-2/3 pl-4">
        <h3 className="text-lg font-semibold drop-shadow-sm">{title}</h3>
        <p className="text-sm opacity-90">{subtitle}</p>
      </div>
    </div>
  )
}

export default StatusWidget
