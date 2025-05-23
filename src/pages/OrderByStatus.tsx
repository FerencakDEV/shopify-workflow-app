import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { Button } from "../components/ui/Button"

type Order = {
  id: number
  name: string
  email: string
  custom_status: string
}

const statusTitleMap: Record<string, string> = {
  new: "New Orders",
  assigned: "Assigned Orders",
  inprogress: "In Progress",
  finishing: "Finishing & Binding",
  checked: "To be Checked",
  dispatch: "Ready for Dispatch",
  pickup: "Ready for Pickup",
  onhold: "On Hold",
  fulfilled: "Fulfilled",
  attention: "Needs Attention",
}

// 💡 mapovanie URL parametra na full backend status
const statusBackendMap: Record<string, string> = {
  new: "New Orders - To be assigned",
  assigned: "Assigned Orders - Not Started",
  inprogress: "In Progress - Design or Print",
  finishing: "Finishing & Binding",
  checked: "To be Checked",
  dispatch: "Ready for Dispatch",
  pickup: "Ready for Pickup",
  onhold: "On Hold",
  fulfilled: "Fulfilled",
  attention: "Need Attention - Order with errors",
}

const OrdersByStatus = () => {
  const { status } = useParams<{ status: string }>()
  const navigate = useNavigate()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!status) return
    const backendStatus = statusBackendMap[status] || status

    setLoading(true)
    axios
      .get(`/orders/with-status?status=${encodeURIComponent(backendStatus)}`)
      .then((res) => {
        setOrders(res.data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching orders:", err)
        setError("Failed to load orders")
        setLoading(false)
      })
  }, [status])

  const pageTitle = status ? statusTitleMap[status] ?? status : "Orders"

  return (
    <div className="space-y-4">
      <Button onClick={() => navigate("/")}>← Back to Dashboard</Button>
      <h1 className="text-2xl font-bold">{pageTitle}</h1>

      {loading && (
        <div className="text-center py-6 text-gray-400 italic">
          Loading orders...
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-6 text-red-500">
          {error}
        </div>
      )}

      {!loading && orders.length === 0 && !error && (
        <div className="text-center py-6 text-gray-500 italic">
          No orders found for this status.
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="bg-zinc-800 p-4 rounded border border-zinc-700">
              <p className="text-lg font-bold">{order.name}</p>
              <p className="text-sm text-gray-400">{order.email}</p>
              <p className="text-sm text-gray-500">{order.custom_status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrdersByStatus
