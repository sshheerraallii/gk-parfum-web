import { Badge, Button, Container, Heading, Input, Label, Select, Switch, Text, Textarea, toast, usePrompt } from "@medusajs/ui"
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { parseBody, parseInline, slugify, videoOf, type BodyBlock } from "../../../lib/post-format"

type Post = {
  id?: string
  title: string
  slug: string
  excerpt: string
  cover_url: string
  body: string
  author: string
  tags: string
  status: "draft" | "published"
  published_at: string // datetime-local value, "" = not set
  seo_title: string
  seo_description: string
}
type Product = { handle: string; title: string }

const EMPTY: Post = {
  title: "",
  slug: "",
  excerpt: "",
  cover_url: "",
  body: "",
  author: "GK Parfum",
  tags: "",
  status: "draft",
  published_at: "",
  seo_title: "",
  seo_description: "",
}

/** <input type="datetime-local"> works in local time without a zone. */
const toLocal = (iso: string | null) => {
  if (!iso) return ""
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

async function upload(file: File): Promise<string> {
  const fd = new FormData()
  fd.append("files", file)
  const r = await fetch("/admin/uploads", { method: "POST", credentials: "include", body: fd })
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || "Upload failed")
  const j = await r.json()
  return j.files[0].url as string
}

/* ── preview (mirrors the website's look, roughly) ─────────────────────────── */
const Inline = ({ text }: { text: string }) => (
  <>
    {parseInline(text).map((n, i) =>
      n.t === "b" ? <strong key={i}>{n.v}</strong> : n.t === "i" ? <em key={i}>{n.v}</em> : n.t === "a" ? <a key={i} href={n.href} target="_blank" rel="noreferrer" className="text-ui-fg-interactive underline">{n.v}</a> : <span key={i}>{n.v}</span>
    )}
  </>
)

function Preview({ blocks, products }: { blocks: BodyBlock[]; products: Product[] }) {
  return (
    <div className="flex flex-col gap-4 text-[15px] leading-7 text-ui-fg-subtle">
      {blocks.map((b, i): ReactNode => {
        switch (b.t) {
          case "h2":
            return <h2 key={i} className="mt-4 font-serif text-2xl text-ui-fg-base"><Inline text={b.text} /></h2>
          case "h3":
            return <h3 key={i} className="mt-2 font-serif text-xl text-ui-fg-base"><Inline text={b.text} /></h3>
          case "p":
            return <p key={i}><Inline text={b.text} /></p>
          case "quote":
            return <blockquote key={i} className="border-l-2 border-ui-border-strong pl-4 font-serif text-lg italic text-ui-fg-base"><Inline text={b.text} /></blockquote>
          case "ul":
            return <ul key={i} className="list-disc pl-5">{b.items.map((t, k) => <li key={k}><Inline text={t} /></li>)}</ul>
          case "ol":
            return <ol key={i} className="list-decimal pl-5">{b.items.map((t, k) => <li key={k}><Inline text={t} /></li>)}</ol>
          case "hr":
            return <hr key={i} className="my-2" />
          case "img":
            return (
              <figure key={i}>
                <img src={b.src} alt={b.alt} className="w-full rounded-lg border" />
                {b.alt && <figcaption className="mt-1 text-center text-xs">{b.alt}</figcaption>}
              </figure>
            )
          case "video":
            return b.video.kind === "file" ? (
              <video key={i} src={b.video.src} controls className="w-full rounded-lg bg-black" />
            ) : (
              <div key={i} className="relative aspect-video overflow-hidden rounded-lg bg-black">
                <iframe
                  title="video"
                  className="absolute inset-0 h-full w-full"
                  src={b.video.kind === "youtube" ? `https://www.youtube-nocookie.com/embed/${b.video.id}` : `https://player.vimeo.com/video/${b.video.id}`}
                  allowFullScreen
                />
              </div>
            )
          case "scents":
            return (
              <div key={i} className="grid grid-cols-3 gap-2">
                {b.slugs.map((h) => {
                  const p = products.find((x) => x.handle === h)
                  return (
                    <div key={h} className={`rounded-lg border p-3 text-center text-xs ${p ? "" : "border-ui-tag-red-border text-ui-tag-red-text"}`}>
                      {p ? <>🧴 {p.title}<br /><span className="text-ui-fg-muted">Add to bag card</span></> : <>“{h}” isn’t a scent — check the spelling</>}
                    </div>
                  )
                })}
              </div>
            )
          case "button":
            return <div key={i}><span className="inline-block rounded-full bg-[#c9a15b] px-5 py-2 text-sm font-medium text-black">{b.label}</span> <span className="text-xs">→ {b.href}</span></div>
        }
      })}
    </div>
  )
}

/* ── editor ───────────────────────────────────────────────────────────────── */
const PostEditor = () => {
  const { id } = useParams()
  const isNew = !id || id === "new"
  const nav = useNavigate()
  const confirm = usePrompt()
  const [p, setP] = useState<Post | null>(isNew ? EMPTY : null)
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [products, setProducts] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState("")
  const [panel, setPanel] = useState<null | "link" | "video" | "scents" | "button">(null)
  const [field, setField] = useState({ a: "", b: "" })
  const [picked, setPicked] = useState<string[]>([])
  const [view, setView] = useState<"both" | "write" | "preview">("both")
  const [site, setSite] = useState("")
  const ta = useRef<HTMLTextAreaElement>(null)
  const imgIn = useRef<HTMLInputElement>(null)
  const vidIn = useRef<HTMLInputElement>(null)
  const coverIn = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/admin/products?limit=200&fields=handle,title,variants.sku&status[]=published", { credentials: "include" })
      .then((r) => r.json())
      .then((j) =>
        setProducts(
          (j.products ?? []).filter((x: Product & { variants?: { sku: string | null }[] }) => !(x.variants ?? []).some((v) => v.sku === "GKP-BOX-01"))
        )
      )
    fetch("/admin/gk/posts", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setSite(j.site ?? ""))
    if (!isNew) {
      fetch(`/admin/gk/posts/${id}`, { credentials: "include" })
        .then((r) => r.json())
        .then(({ post }) =>
          setP({
            id: post.id,
            title: post.title ?? "",
            slug: post.slug ?? "",
            excerpt: post.excerpt ?? "",
            cover_url: post.cover_url ?? "",
            body: post.body ?? "",
            author: post.author ?? "",
            tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
            status: post.status,
            published_at: toLocal(post.published_at),
            seo_title: post.seo_title ?? "",
            seo_description: post.seo_description ?? "",
          })
        )
    }
  }, [id, isNew])

  const set = (patch: Partial<Post>) => setP((cur) => (cur ? { ...cur, ...patch } : cur))
  const blocks = useMemo(() => parseBody(p?.body ?? ""), [p?.body])

  /** Wraps the selection (or inserts at the cursor) and keeps the cursor sensible. */
  const insert = (before: string, after = "", placeholder = "") => {
    const el = ta.current
    if (!el || !p) return
    const { selectionStart: s, selectionEnd: e, value } = el
    const sel = value.slice(s, e) || placeholder
    const next = value.slice(0, s) + before + sel + after + value.slice(e)
    set({ body: next })
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = s + before.length
      el.selectionEnd = s + before.length + sel.length
    })
  }
  /** Puts something on its own line(s) at the cursor. */
  const block = (text: string) => {
    const el = ta.current
    if (!el || !p) return
    const { selectionStart: s, value } = el
    const pre = value.slice(0, s)
    const lead = pre === "" || pre.endsWith("\n\n") ? "" : pre.endsWith("\n") ? "\n" : "\n\n"
    const next = pre + lead + text + "\n\n" + value.slice(s).replace(/^\n+/, "")
    set({ body: next })
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = el.selectionEnd = (pre + lead + text + "\n\n").length
    })
  }
  const linePrefix = (prefix: string) => {
    const el = ta.current
    if (!el || !p) return
    const { selectionStart: s, selectionEnd: e, value } = el
    const from = value.lastIndexOf("\n", s - 1) + 1
    const chunk = value.slice(from, e)
    const done = chunk
      .split("\n")
      .map((l, i) => (prefix === "1. " ? `${i + 1}. ` : prefix) + l.replace(/^(#{2,3} |[-*] |\d+\. |> )/, ""))
      .join("\n")
    set({ body: value.slice(0, from) + done + value.slice(e) })
    requestAnimationFrame(() => el.focus())
  }

  const doUpload = async (file: File | undefined, kind: "image" | "video" | "cover") => {
    if (!file) return
    if (file.size > 50 * 1024 * 1024) {
      toast.error("That file is over 50 MB", { description: "For long videos, upload to YouTube and paste the link instead." })
      return
    }
    setBusy(kind === "video" ? "Uploading video…" : "Uploading photo…")
    try {
      const url = await upload(file)
      if (kind === "cover") set({ cover_url: url })
      else if (kind === "image") block(`![${file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")}](${url})`)
      else block(url)
      toast.success(kind === "cover" ? "Cover photo added" : "Added to the post")
    } catch (e) {
      toast.error("Upload failed", { description: (e as Error).message })
    } finally {
      setBusy("")
    }
  }

  const save = useCallback(
    async (status?: Post["status"]) => {
      if (!p) return
      const next = { ...p, status: status ?? p.status }
      if (!next.title.trim()) return toast.error("Give the post a title first")
      const slug = slugify(next.slug || next.title)
      if (!slug) return toast.error("The web address needs some letters or numbers")
      setSaving(true)
      const body = {
        title: next.title.trim(),
        slug,
        excerpt: next.excerpt.trim() || null,
        cover_url: next.cover_url.trim() || null,
        body: next.body,
        author: next.author.trim() || null,
        tags: next.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12),
        status: next.status,
        published_at: next.published_at ? new Date(next.published_at).toISOString() : null,
        seo_title: next.seo_title.trim() || null,
        seo_description: next.seo_description.trim() || null,
      }
      const r = await fetch(isNew ? "/admin/gk/posts" : `/admin/gk/posts/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      setSaving(false)
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        toast.error("Couldn't save", { description: j.message })
        return
      }
      setP({ ...next, slug, published_at: toLocal(j.post.published_at) })
      toast.success(next.status === "published" ? "Saved — live on the website within a few minutes" : "Draft saved", {
        description: next.status === "published" ? undefined : "Drafts aren't shown on the website.",
      })
      if (isNew) nav(`/blog/${j.post.id}`, { replace: true })
    },
    [p, id, isNew, nav]
  )

  // Ctrl/Cmd+S saves
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [save])

  const remove = async () => {
    const ok = await confirm({ title: "Delete this post?", description: "It disappears from the website straight away.", confirmText: "Delete", cancelText: "Keep it" })
    if (!ok) return
    const r = await fetch(`/admin/gk/posts/${id}`, { method: "DELETE", credentials: "include" })
    if (r.ok) {
      toast.success("Post deleted")
      nav("/blog")
    } else toast.error("Couldn't delete")
  }

  if (!p) return <Container className="p-6"><Text>Loading…</Text></Container>

  const live = p.status === "published"
  const scheduled = live && p.published_at && new Date(p.published_at) > new Date()
  const T = ({ label, onClick, title }: { label: ReactNode; onClick: () => void; title: string }) => (
    <Button type="button" size="small" variant="transparent" title={title} onClick={onClick} className="h-8 min-w-8 px-2">
      {label}
    </Button>
  )

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link to="/blog" className="txt-compact-small text-ui-fg-subtle hover:text-ui-fg-base">← All posts</Link>
          <Heading level="h1">{isNew ? "New post" : "Edit post"}</Heading>
          {live ? <Badge size="2xsmall" color={scheduled ? "orange" : "green"}>{scheduled ? "Scheduled" : "Live"}</Badge> : <Badge size="2xsmall" color="grey">Draft</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {busy && <Text size="small" className="text-ui-fg-subtle">{busy}</Text>}
          {!isNew && live && site && (
            <a href={`${site}/blog/${p.slug}`} target="_blank" rel="noreferrer" className="txt-compact-small mr-2 text-ui-fg-interactive">View on site ↗</a>
          )}
          {live ? (
            <>
              <Button size="small" variant="secondary" isLoading={saving} onClick={() => save("draft")}>Unpublish</Button>
              <Button size="small" isLoading={saving} onClick={() => save()}>Save</Button>
            </>
          ) : (
            <>
              <Button size="small" variant="secondary" isLoading={saving} onClick={() => save("draft")}>Save draft</Button>
              <Button size="small" isLoading={saving} onClick={() => save("published")}>Publish</Button>
            </>
          )}
        </div>
      </Container>

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        {/* main column */}
        <Container className="flex flex-col gap-y-5 px-6 py-5">
          <div>
            <Label size="small">Title</Label>
            <Input
              value={p.title}
              placeholder="e.g. 5 date-night scents that last all evening"
              onChange={(e) => set({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
            />
          </div>
          <div>
            <Label size="small">Web address</Label>
            <div className="flex items-center gap-1">
              <Text size="small" className="whitespace-nowrap text-ui-fg-muted">/blog/</Text>
              <Input
                value={p.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })
                }}
                onBlur={() => set({ slug: slugify(p.slug) })}
              />
            </div>
            {!isNew && live && <Text size="xsmall" className="mt-1 text-ui-fg-muted">Changing this breaks links people have already shared.</Text>}
          </div>
          <div>
            <Label size="small">Short summary</Label>
            <Textarea rows={2} value={p.excerpt} maxLength={400} placeholder="One or two sentences. Shown on the blog page and in Google." onChange={(e) => set({ excerpt: e.target.value })} />
          </div>

          {/* body */}
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <Label size="small">Post</Label>
              <Select size="small" value={view} onValueChange={(v) => setView(v as typeof view)}>
                <Select.Trigger className="w-40"><Select.Value /></Select.Trigger>
                <Select.Content>
                  <Select.Item value="both">Write + preview</Select.Item>
                  <Select.Item value="write">Write only</Select.Item>
                  <Select.Item value="preview">Preview only</Select.Item>
                </Select.Content>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 bg-ui-bg-subtle px-1 py-1">
              <T title="Heading" label={<b>H2</b>} onClick={() => linePrefix("## ")} />
              <T title="Smaller heading" label={<b className="text-xs">H3</b>} onClick={() => linePrefix("### ")} />
              <T title="Bold" label={<b>B</b>} onClick={() => insert("**", "**", "bold text")} />
              <T title="Italic" label={<i>I</i>} onClick={() => insert("*", "*", "italic text")} />
              <T title="Link" label="🔗" onClick={() => { setField({ a: ta.current ? ta.current.value.slice(ta.current.selectionStart, ta.current.selectionEnd) : "", b: "" }); setPanel(panel === "link" ? null : "link") }} />
              <T title="Bullet list" label="•" onClick={() => linePrefix("- ")} />
              <T title="Numbered list" label="1." onClick={() => linePrefix("1. ")} />
              <T title="Quote" label="❝" onClick={() => linePrefix("> ")} />
              <T title="Divider" label="—" onClick={() => block("---")} />
              <span className="mx-1 h-5 w-px bg-ui-border-base" />
              <T title="Add a photo" label="🖼 Photo" onClick={() => imgIn.current?.click()} />
              <T title="Add a video" label="▶ Video" onClick={() => { setField({ a: "", b: "" }); setPanel(panel === "video" ? null : "video") }} />
              <T title="Show scents with Add to bag" label="🧴 Scents" onClick={() => { setPicked([]); setPanel(panel === "scents" ? null : "scents") }} />
              <T title="Add a button" label="⬭ Button" onClick={() => { setField({ a: "Shop the collection", b: "/shop" }); setPanel(panel === "button" ? null : "button") }} />
              <input ref={imgIn} type="file" accept="image/*" hidden onChange={(e) => { doUpload(e.target.files?.[0], "image"); e.target.value = "" }} />
              <input ref={vidIn} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={(e) => { doUpload(e.target.files?.[0], "video"); e.target.value = "" }} />
            </div>

            {panel && (
              <div className="flex flex-wrap items-end gap-2 border border-b-0 bg-ui-bg-component px-3 py-3">
                {panel === "link" && (
                  <>
                    <div className="min-w-[160px] flex-1"><Label size="xsmall">Text</Label><Input size="small" value={field.a} onChange={(e) => setField({ ...field, a: e.target.value })} /></div>
                    <div className="min-w-[200px] flex-[2]"><Label size="xsmall">Link to (https://… or /shop/men)</Label><Input size="small" value={field.b} onChange={(e) => setField({ ...field, b: e.target.value })} /></div>
                    <Button size="small" onClick={() => { insert(`[${field.a || "link"}](${field.b || "/"})`, ""); setPanel(null) }}>Insert</Button>
                  </>
                )}
                {panel === "video" && (
                  <>
                    <div className="min-w-[260px] flex-1">
                      <Label size="xsmall">YouTube or Vimeo link</Label>
                      <Input size="small" placeholder="https://www.youtube.com/watch?v=…" value={field.a} onChange={(e) => setField({ ...field, a: e.target.value })} />
                    </div>
                    <Button
                      size="small"
                      onClick={() => {
                        if (!videoOf(field.a)) return toast.error("That doesn't look like a YouTube or Vimeo link")
                        block(field.a.trim())
                        setPanel(null)
                      }}
                    >
                      Insert
                    </Button>
                    <Text size="small" className="text-ui-fg-muted">or</Text>
                    <Button size="small" variant="secondary" onClick={() => { setPanel(null); vidIn.current?.click() }}>Upload a clip (mp4, up to 50 MB)</Button>
                  </>
                )}
                {panel === "scents" && (
                  <div className="w-full">
                    <Label size="xsmall">Pick the scents to show (each gets an Add to bag button)</Label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {products.map((x) => (
                        <button
                          key={x.handle}
                          type="button"
                          onClick={() => setPicked(picked.includes(x.handle) ? picked.filter((h) => h !== x.handle) : [...picked, x.handle])}
                          className={`txt-compact-small rounded-full border px-3 py-1 ${picked.includes(x.handle) ? "border-ui-fg-interactive bg-ui-bg-interactive text-ui-fg-on-color" : "hover:bg-ui-bg-base-hover"}`}
                        >
                          {x.title}
                        </button>
                      ))}
                    </div>
                    <Button className="mt-3" size="small" disabled={!picked.length} onClick={() => { block(`{{scents: ${picked.join(", ")}}}`); setPanel(null) }}>
                      Insert {picked.length || ""} scent{picked.length === 1 ? "" : "s"}
                    </Button>
                  </div>
                )}
                {panel === "button" && (
                  <>
                    <div className="min-w-[160px] flex-1"><Label size="xsmall">Button text</Label><Input size="small" value={field.a} onChange={(e) => setField({ ...field, a: e.target.value })} /></div>
                    <div className="min-w-[160px] flex-1"><Label size="xsmall">Goes to</Label><Input size="small" value={field.b} onChange={(e) => setField({ ...field, b: e.target.value })} /></div>
                    <Button size="small" onClick={() => { block(`{{button: ${field.a || "Shop now"} | ${field.b || "/shop"}}}`); setPanel(null) }}>Insert</Button>
                  </>
                )}
              </div>
            )}

            <div className={`grid gap-3 ${view === "both" ? "lg:grid-cols-2" : ""}`}>
              {view !== "preview" && (
                <textarea
                  ref={ta}
                  value={p.body}
                  onChange={(e) => set({ body: e.target.value })}
                  onDrop={(e) => {
                    const f = e.dataTransfer.files?.[0]
                    if (f && (f.type.startsWith("image/") || f.type.startsWith("video/"))) {
                      e.preventDefault()
                      doUpload(f, f.type.startsWith("video/") ? "video" : "image")
                    }
                  }}
                  onPaste={(e) => {
                    const f = e.clipboardData.files?.[0]
                    if (f && f.type.startsWith("image/")) {
                      e.preventDefault()
                      doUpload(f, "image")
                    }
                  }}
                  placeholder={"Start writing…\n\nTip: drop or paste a photo straight in here."}
                  className="min-h-[520px] w-full rounded-b-lg border bg-ui-bg-field px-4 py-3 font-mono text-[13px] leading-6 text-ui-fg-base outline-none focus:shadow-borders-interactive-with-active"
                />
              )}
              {view !== "write" && (
                <div className={`min-h-[520px] overflow-auto rounded-lg border bg-ui-bg-base px-6 py-5 ${view === "preview" ? "rounded-t-none" : ""}`}>
                  {p.cover_url && <img src={p.cover_url} alt="" className="mb-5 aspect-[16/9] w-full rounded-lg object-cover" />}
                  <h1 className="font-serif text-3xl text-ui-fg-base">{p.title || "Your title"}</h1>
                  {p.excerpt && <p className="mt-2 text-ui-fg-subtle">{p.excerpt}</p>}
                  <div className="mt-6">{blocks.length ? <Preview blocks={blocks} products={products} /> : <Text className="text-ui-fg-muted">The preview appears here as you write.</Text>}</div>
                </div>
              )}
            </div>
            <details className="mt-3">
              <summary className="txt-compact-small cursor-pointer text-ui-fg-subtle">Writing tips</summary>
              <div className="txt-compact-small mt-2 grid gap-1 text-ui-fg-subtle">
                <span><code>## Heading</code> · <code>### Smaller heading</code> · <code>**bold**</code> · <code>*italic*</code> · <code>[text](https://…)</code></span>
                <span><code>- point</code> for bullets, <code>1. step</code> for numbers, <code>&gt; quote</code>, <code>---</code> for a divider</span>
                <span>Leave an empty line between paragraphs. Photos, videos and scents go on their own line — the buttons above do it for you.</span>
                <span>A YouTube or Vimeo link on its own line becomes a playable video.</span>
              </div>
            </details>
          </div>
        </Container>

        {/* side column */}
        <div className="flex flex-col gap-3">
          <Container className="flex flex-col gap-y-4 px-6 py-5">
            <Heading level="h2">Publishing</Heading>
            <div className="flex items-center justify-between">
              <Label size="small">Show on the website</Label>
              <Switch checked={live} onCheckedChange={(v) => set({ status: v ? "published" : "draft" })} />
            </div>
            <div>
              <Label size="small">Publish date</Label>
              <Input type="datetime-local" value={p.published_at} onChange={(e) => set({ published_at: e.target.value })} />
              <Text size="xsmall" className="mt-1 text-ui-fg-muted">Leave empty to publish now. A future date schedules it.</Text>
            </div>
            <div>
              <Label size="small">Author</Label>
              <Input value={p.author} onChange={(e) => set({ author: e.target.value })} />
            </div>
            <div>
              <Label size="small">Topics</Label>
              <Input value={p.tags} placeholder="Guides, Date night, New in" onChange={(e) => set({ tags: e.target.value })} />
              <Text size="xsmall" className="mt-1 text-ui-fg-muted">Separate with commas. The first one shows on the post.</Text>
            </div>
          </Container>

          <Container className="flex flex-col gap-y-3 px-6 py-5">
            <Heading level="h2">Cover photo</Heading>
            <div className="aspect-[16/9] overflow-hidden rounded-lg border bg-ui-bg-subtle">
              {p.cover_url ? <img src={p.cover_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Text size="small" className="text-ui-fg-muted">No cover yet</Text></div>}
            </div>
            <div className="flex gap-2">
              <Button size="small" variant="secondary" onClick={() => coverIn.current?.click()}>{p.cover_url ? "Change" : "Upload"}</Button>
              {p.cover_url && <Button size="small" variant="transparent" onClick={() => set({ cover_url: "" })}>Remove</Button>}
              <input ref={coverIn} type="file" accept="image/*" hidden onChange={(e) => { doUpload(e.target.files?.[0], "cover"); e.target.value = "" }} />
            </div>
            <Input size="small" placeholder="…or paste an image link" value={p.cover_url} onChange={(e) => set({ cover_url: e.target.value })} />
            <Text size="xsmall" className="text-ui-fg-muted">Landscape works best (about 1600 × 900). Also used when the post is shared on social media.</Text>
          </Container>

          <Container className="flex flex-col gap-y-3 px-6 py-5">
            <Heading level="h2">Google</Heading>
            <div>
              <Label size="small">Search title</Label>
              <Input value={p.seo_title} maxLength={120} placeholder={p.title} onChange={(e) => set({ seo_title: e.target.value })} />
              <Text size="xsmall" className={`mt-1 ${(p.seo_title || p.title).length > 60 ? "text-ui-tag-orange-text" : "text-ui-fg-muted"}`}>{(p.seo_title || p.title).length}/60 — longer titles get cut off</Text>
            </div>
            <div>
              <Label size="small">Search description</Label>
              <Textarea rows={3} maxLength={320} value={p.seo_description} placeholder={p.excerpt} onChange={(e) => set({ seo_description: e.target.value })} />
              <Text size="xsmall" className={`mt-1 ${(p.seo_description || p.excerpt).length > 160 ? "text-ui-tag-orange-text" : "text-ui-fg-muted"}`}>{(p.seo_description || p.excerpt).length}/160</Text>
            </div>
            <div className="rounded-lg border p-3">
              <Text size="xsmall" className="truncate text-ui-fg-muted">{(site || "https://gkparfum.co.uk").replace(/^https?:\/\//, "")} › blog › {p.slug || "…"}</Text>
              <Text size="small" className="truncate text-[#1a0dab]">{p.seo_title || p.title || "Your title"}</Text>
              <Text size="xsmall" className="line-clamp-2 text-ui-fg-subtle">{p.seo_description || p.excerpt || "Your summary appears here."}</Text>
            </div>
          </Container>

          {!isNew && (
            <Container className="px-6 py-4">
              <Button size="small" variant="danger" onClick={remove}>Delete post</Button>
            </Container>
          )}
        </div>
      </div>
    </div>
  )
}

export default PostEditor
