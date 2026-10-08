import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Star } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Tabs, Text, toast } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"

type Review = {
  id: string
  product_handle: string | null
  name: string
  email: string
  rating: number
  title: string | null
  body: string
  verified: boolean
  status: "pending" | "approved" | "rejected"
  created_at: string
}

const stars = (n: number) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n)

const ReviewsPage = () => {
  const [rows, setRows] = useState<Review[] | null>(null)
  const [tab, setTab] = useState<Review["status"]>("pending")

  const load = useCallback(() => {
    fetch("/admin/gk/reviews", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setRows(j.reviews))
  }, [])
  useEffect(load, [load])

  const setStatus = async (id: string, status: Review["status"]) => {
    const r = await fetch(`/admin/gk/reviews/${id}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (r.ok) {
      toast.success(status === "approved" ? "Review is live on the site" : status === "rejected" ? "Review hidden" : "Moved back to pending")
      load()
    } else {
      toast.error("Couldn't update the review")
    }
  }

  const list = (rows ?? []).filter((r) => r.status === tab)
  const count = (s: Review["status"]) => (rows ?? []).filter((r) => r.status === s).length

  return (
    <Container className="p-0">
      <div className="px-6 py-4">
        <Heading level="h1">Reviews</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Customer reviews appear on the website only after you approve them. "Verified" means the email has ordered that scent.
        </Text>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Review["status"])}>
        <Tabs.List className="px-6">
          <Tabs.Trigger value="pending">Waiting ({count("pending")})</Tabs.Trigger>
          <Tabs.Trigger value="approved">Live ({count("approved")})</Tabs.Trigger>
          <Tabs.Trigger value="rejected">Hidden ({count("rejected")})</Tabs.Trigger>
        </Tabs.List>
      </Tabs>
      {!rows ? (
        <Text size="small" className="px-6 py-6">Loading…</Text>
      ) : list.length === 0 ? (
        <Text size="small" className="px-6 py-6 text-ui-fg-subtle">Nothing here.</Text>
      ) : (
        <ul className="divide-y">
          {list.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 px-6 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Text className="text-ui-tag-orange-icon">{stars(r.rating)}</Text>
                <Text weight="plus">{r.title ?? "No title"}</Text>
                {r.verified && <Badge size="2xsmall" color="green">Verified buyer</Badge>}
                <Badge size="2xsmall">{r.product_handle ?? "Shop review"}</Badge>
              </div>
              <Text size="small">{r.body}</Text>
              <Text size="xsmall" className="text-ui-fg-subtle">
                {r.name} · {r.email} · {new Date(r.created_at).toLocaleDateString("en-GB")}
              </Text>
              <div className="flex gap-2">
                {r.status !== "approved" && <Button size="small" onClick={() => setStatus(r.id, "approved")}>Approve</Button>}
                {r.status !== "rejected" && <Button size="small" variant="secondary" onClick={() => setStatus(r.id, "rejected")}>Hide</Button>}
                {r.status !== "pending" && <Button size="small" variant="transparent" onClick={() => setStatus(r.id, "pending")}>Back to waiting</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Reviews", icon: Star })

export default ReviewsPage
