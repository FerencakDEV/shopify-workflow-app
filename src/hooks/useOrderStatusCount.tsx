import { useEffect, useState } from "react"
import axios from "axios"

type StatusCounts = Record<string, number>
const normalizeStatus = (status: string) => {
  switch (status) {
    case "New Orders - To be assigned": return "new"
    case "Assigned Orders - Not Started": return "assigned"
    case "In Progress - Design or Print": return "inprogress"
    case "Finishing & Binding": return "finishing"
    case "To be Checked": return "checked"
    case "Ready for Dispatch": return "dispatch"
    case "Ready for Pickup": return "pickup"
    case "On Hold": return "onhold"
    case "Fulfilled": return "fulfilled"
    case "Need Attention - Order with errors": return "attention"
    default: return "unknown"
  }
}

export function useOrderStatusCounts() {
  const [counts, setCounts] = useState<StatusCounts>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
  axios.get("/orders/stats")
    .then((res) => {
      const statusMap: StatusCounts = {};
      for (const row of res.data) {
        const key = normalizeStatus(row.status || "unknown");
        statusMap[key] = row.count;
      }
      setCounts(statusMap);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Failed to load order counts", err);
      setError("Failed to load order counts");
      setLoading(false);
    });
}, []);

  
  return { counts, loading, error }
}
