import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"

type Msg = { id: string; name: string; email: string; order_ref: string | null; message: string; status: "new" | "replied" | "archived"; created_at: string }

const MessagesPage = () => {
  const [rows, setRows] = useState<Msg[] | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const load = useCallback(() => {
    fetch("/admin/gk/messages", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setRows(j.messages))
  }, [])
  useEffect(load, [load])

  const setStatus = async (id: string, status: Msg["status"]) => {
    const r = await fetch(`/admin/gk/messages/${id}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (r.ok) {
      load()
    } else {
      toast.error("Couldn't update the message")
    }
  }

  const list = (rows ?? []).filter((m) => showArchived || m.status !== "archived")

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Messages</Heading>
          <Text size="small" className="text-ui-fg-subtle">Sent from the Contact us page. Reply from your own email, then mark as replied.</Text>
        </div>
        <Button size="small" variant="secondary" onClick={() => setShowArchived((v) => !v)}>
          {showArchived ? "Hide archived" : "Show archived"}
        </Button>
      </div>
      {!rows ? (
        <Text size="small" className="px-6 pb-6">Loading…</Text>
      ) : list.length === 0 ? (
        <Text size="small" className="px-6 pb-6 text-ui-fg-subtle">No messages.</Text>
      ) : (
        <ul className="divide-y">
          {list.map((m) => (
            <li key={m.id} className="flex flex-col gap-2 px-6 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Text weight="plus">{m.name}</Text>
                <a className="text-ui-fg-interactive text-sm" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to GK Parfum")}`}>{m.email}</a>
                {m.order_ref && <Badge size="2xsmall">Order {m.order_ref}</Badge>}
                <Badge size="2xsmall" color={m.status === "new" ? "orange" : m.status === "replied" ? "green" : "grey"}>{m.status}</Badge>
              </div>
              <Text size="small" className="whitespace-pre-wrap">{m.message}</Text>
              <Text size="xsmall" className="text-ui-fg-subtle">{new Date(m.created_at).toLocaleString("en-GB")}</Text>
              <div className="flex gap-2">
                {m.status !== "replied" && <Button size="small" onClick={() => setStatus(m.id, "replied")}>Mark replied</Button>}
                {m.status !== "archived" && <Button size="small" variant="secondary" onClick={() => setStatus(m.id, "archived")}>Archive</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Messages", icon: ChatBubbleLeftRight })

export default MessagesPage
