import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Newspaper } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Table, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

type Row = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_url: string | null
  status: "draft" | "published"
  published_at: string | null
  updated_at: string
}

const when = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—")

const BlogPage = () => {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [site, setSite] = useState("")
  const nav = useNavigate()

  useEffect(() => {
    fetch("/admin/gk/posts", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        setRows(j.posts ?? [])
        setSite(j.site ?? "")
      })
  }, [])

  const state = (r: Row) =>
    r.status === "draft" ? (
      <Badge size="2xsmall" color="grey">Draft</Badge>
    ) : r.published_at && new Date(r.published_at) > new Date() ? (
      <Badge size="2xsmall" color="orange">Scheduled</Badge>
    ) : (
      <Badge size="2xsmall" color="green">Live</Badge>
    )

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div>
          <Heading level="h1">Blog</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Write posts for the website's journal — with photos, videos and scent cards. Drafts stay hidden until you publish.
          </Text>
        </div>
        <Button size="small" onClick={() => nav("/blog/new")}>New post</Button>
      </div>
      {rows === null ? (
        <Text className="px-6 py-4">Loading…</Text>
      ) : rows.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <Text>No posts yet.</Text>
          <Button className="mt-3" size="small" variant="secondary" onClick={() => nav("/blog/new")}>Write the first one</Button>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Post</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Published</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((r) => (
              <Table.Row key={r.id} className="cursor-pointer" onClick={() => nav(`/blog/${r.id}`)}>
                <Table.Cell>
                  <div className="flex items-center gap-3 py-2">
                    <div className="h-10 w-14 shrink-0 overflow-hidden rounded bg-ui-bg-subtle">
                      {r.cover_url && <img src={r.cover_url} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <Text size="small" weight="plus" className="truncate">{r.title}</Text>
                      <Text size="xsmall" className="truncate text-ui-fg-subtle">/blog/{r.slug}</Text>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>{state(r)}</Table.Cell>
                <Table.Cell>{when(r.published_at)}</Table.Cell>
                <Table.Cell onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-3">
                    <Link to={`/blog/${r.id}`} className="txt-compact-small text-ui-fg-interactive">Edit</Link>
                    {site && r.status === "published" && (
                      <a href={`${site}/blog/${r.slug}`} target="_blank" rel="noreferrer" className="txt-compact-small text-ui-fg-interactive">
                        View ↗
                      </a>
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Blog", icon: Newspaper })

export default BlogPage
