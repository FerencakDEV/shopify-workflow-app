import { useOrderStatusCounts } from "../hooks/useOrderStatusCount"
import StatusWidget from "../components/StatusWidget"
import WorkloadChart from "../components/WorkloadChart"

const Home = () => {
  const { counts } = useOrderStatusCounts()

  return (
    <main style={{ height: "calc(100vh - 162px)" }} className="h-screen overflow-y-auto lg:overflow-hidden box-border mt-90px-">
      <div className="h-screen box-border grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-zinc-800">

        <div className="lg:h-[50vh] grid grid-cols-1 sm:grid-cols-2 gap-4">

          <StatusWidget title="New Orders" subtitle="To be assigned" count={counts["new"] ?? 0} color="bg-muted" route="/orders/status/new" />
          <StatusWidget title="Assigned Orders" subtitle="Not Started" count={counts["assigned"] ?? 0} color="bg-primary-light" route="/orders/status/assigned" />
          <StatusWidget title="In Progress" subtitle="Design or Print" count={counts["inprogress"] ?? 0} color="bg-warning" route="/orders/status/inprogress" />
          <StatusWidget title="Finishing & Binding" subtitle="Near completion" count={counts["finishing"] ?? 0} color="bg-info" route="/orders/status/finishing" />
          <StatusWidget title="To be Checked" subtitle="Needs verification" count={counts["checked"] ?? 0} color="bg-smooth" route="/orders/status/checked" />
          <StatusWidget title="Need Attention" subtitle="Order with errors" count={counts["attention"] ?? 0} color="bg-city" route="/orders/status/attention" />
          <StatusWidget title="Ready for Dispatch" subtitle="Outbound prep" count={counts["dispatch"] ?? 0} color="bg-primary-darker" route="/orders/status/dispatch" />
          <StatusWidget title="On Hold" subtitle="Waiting" count={counts["onhold"] ?? 0} color="bg-city-light" route="/orders/status/onhold" />
          <StatusWidget title="Ready for Pickup" subtitle="Customer notified" count={counts["pickup"] ?? 0} color="bg-primary-dark" route="/orders/status/pickup" />
          <StatusWidget title="All Orders" subtitle="Fulfilled" count={counts["fulfilled"] ?? 0} color="bg-success" route="/orders/status/fulfilled" />

        </div>

        <div className="h-[50vh]">
          <WorkloadChart />
        </div>
      </div>
    </main>
  )
}

export default Home
