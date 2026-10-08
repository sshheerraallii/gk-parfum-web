import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Envelope } from "@medusajs/icons"
import { Button, Container, Heading, Table, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

type Sub = { id: string; email: string; phone: string | null; source: string; in_prize_draw: boolean; created_at: string }

const NewsletterPage = () => {
  const [rows, setRows] = useState<Sub[] | null>(null)
  useEffect(() => {
    fetch("/admin/gk/subscribers", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setRows(j.subscribers))
  }, [])

  const download = async () => {
    const r = await fetch("/admin/gk/subscribers?format=csv", { credentials: "include" })
    const url = URL.createObjectURL(await r.blob())
    const a = document.createElement("a")
    a.href = url
    a.download = "gk-subscribers.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Newsletter</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Sign-ups from the "win a free bottle" pop-up{rows ? ` — ${rows.length} so far` : ""}. Download to import into your email tool.
          </Text>
        </div>
        <Button variant="secondary" onClick={download} disabled={!rows?.length}>Download CSV</Button>
      </div>
      {!rows ? (
        <Text size="small" className="px-6 pb-6">Loading…</Text>
      ) : rows.length === 0 ? (
        <Text size="small" className="px-6 pb-6 text-ui-fg-subtle">No sign-ups yet.</Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Phone</Table.HeaderCell>
              <Table.HeaderCell>From</Table.HeaderCell>
              <Table.HeaderCell>Signed up</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((r) => (
              <Table.Row key={r.id}>
                <Table.Cell>{r.email}</Table.Cell>
                <Table.Cell>{r.phone ?? "—"}</Table.Cell>
                <Table.Cell>{r.source}</Table.Cell>
                <Table.Cell>{new Date(r.created_at).toLocaleDateString("en-GB")}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Newsletter", icon: Envelope })

export default NewsletterPage
