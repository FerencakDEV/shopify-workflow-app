import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

const data = [
  { name: "Q1", inProgress: 2, assigned: 3 },
  { name: "Q2", inProgress: 5, assigned: 3 },
  { name: "design2", inProgress: 0, assigned: 4 },
  { name: "online", inProgress: 2, assigned: 4 },
  { name: "magic t.", inProgress: 1, assigned: 4 },
  { name: "posters", inProgress: 3, assigned: 4 },
  { name: "thesis", inProgress: 1, assigned: 5 },
]

// Zistenie maximálnej hodnoty z grafu
const maxY = Math.max(...data.flatMap(d => [d.inProgress, d.assigned]))
const yDomainMax = Math.ceil(maxY / 5) * 5 || 1 // napr. zaokrúhli na najbližšie 5

export default function WorkloadChart() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">
          Workload <span className="text-sm text-gray-400 ml-1">Real-Time</span>
        </h2>
        <button className="text-sm bg-cyan-500 text-white px-3 py-1 rounded hover:bg-cyan-600 transition">
          Print & Design
        </button>
      </div>

      <div className="flex items-center gap-4 mb-2 justify-center">
        <div className="text-sm font-semibold text-orange-600">
          <span className="bg-orange-600 text-white px-2 py-0.5 rounded mr-1">10</span>
          Orders in Progress
        </div>
        <div className="text-sm font-semibold text-gray-500">
          <span className="bg-gray-300 text-black px-2 py-0.5 rounded mr-1">11</span>
          Assigned Orders
        </div>
      </div>

      {/* Dynamický bar chart */}
      <ResponsiveContainer width="100%" height={230}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
        >
          {/* Horizontálne pomocné čiary */}
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            domain={[0, yDomainMax]}
            ticks={Array.from({ length: yDomainMax }, (_, i) => i + 1)}
            tick={{ fontSize: 10 }}
          />
          <Tooltip />
          <Bar dataKey="assigned" fill="#d1d5db" radius={[4, 4, 0, 0]} />
          <Bar dataKey="inProgress" fill="#f97316" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Štatistiky pod stĺpcami */}
      <div className="grid grid-cols-7 text-center mt-4 text-sm text-gray-800 dark:text-white">
        {data.map((item) => (
          <div key={item.name} className="space-y-1">
            <div className="text-sm font-medium">
              <span className="text-orange-600">{item.inProgress}</span>{" "}
              <span className="mx-1">|</span>
              <span className="text-gray-500">{item.assigned}</span>
            </div>
            <div className="text-xs">{item.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
