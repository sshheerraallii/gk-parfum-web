import { defineRouteConfig } from "@medusajs/admin-sdk"
import { MagnifyingGlass } from "@medusajs/icons"
import { Badge, Container, Heading, Table, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

type Data = {
  total: number
  top: { keyword: string; count: number }[]
  no_results: { query: string; count: number }[]
  recent: { id: string; query: string; results: number; source: string; created_at: string }[]
}

const SearchesPage = () => {
  const [d, setD] = useState<Data | null>(null)
  useEffect(() => {
    fetch("/admin/gk/searches", { credentials: "include" })
      .then((r) => r.json())
      .then(setD)
  }, [])

  if (!d) {
    return <Container className="p-6"><Text>Loading searches…</Text></Container>
  }
  const max = d.top[0]?.count ?? 1

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="px-6 py-4">
        <Heading level="h1">What shoppers are looking for</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Everything typed into "Which perfume do you love?" and the search page in the last 90 days — {d.total} searches.
          Use it to choose new scents and write ads in your customers' words.
        </Text>
      </Container>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Container className="p-0">
          <div className="px-6 py-4"><Heading level="h2">Most-searched words</Heading></div>
          {d.top.length === 0 ? (
            <Text size="small" className="px-6 pb-6 text-ui-fg-subtle">No searches yet.</Text>
          ) : (
            <ul className="px-6 pb-6">
              {d.top.map((k) => (
                <li key={k.keyword} className="flex items-center gap-3 py-1.5">
                  <Text size="small" className="w-32 shrink-0">{k.keyword}</Text>
                  <div className="h-2 flex-1 rounded-full bg-ui-bg-subtle">
                    <div className="h-2 rounded-full bg-ui-fg-interactive" style={{ width: `${(k.count / max) * 100}%` }} />
                  </div>
                  <Text size="small" className="w-10 text-right text-ui-fg-subtle">{k.count}</Text>
                </li>
              ))}
            </ul>
          )}
        </Container>

        <Container className="p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Searches with no match</Heading>
            <Text size="small" className="text-ui-fg-subtle">Scents people want that you don't stock yet.</Text>
          </div>
          {d.no_results.length === 0 ? (
            <Text size="small" className="px-6 pb-6 text-ui-fg-subtle">Every search found something.</Text>
          ) : (
            <ul className="px-6 pb-6">
              {d.no_results.map((q) => (
                <li key={q.query} className="flex justify-between py-1.5">
                  <Text size="small">{q.query}</Text>
                  <Badge size="2xsmall">{q.count}×</Badge>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </div>

      <Container className="p-0">
        <div className="px-6 py-4"><Heading level="h2">Recent searches</Heading></div>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Typed</Table.HeaderCell>
              <Table.HeaderCell>Results</Table.HeaderCell>
              <Table.HeaderCell>Where</Table.HeaderCell>
              <Table.HeaderCell>When</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {d.recent.map((r) => (
              <Table.Row key={r.id}>
                <Table.Cell>{r.query}</Table.Cell>
                <Table.Cell>{r.results}</Table.Cell>
                <Table.Cell>{r.source === "matcher" ? "Perfume finder" : "Search page"}</Table.Cell>
                <Table.Cell>{new Date(r.created_at).toLocaleString("en-GB")}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Searches", icon: MagnifyingGlass })

export default SearchesPage
