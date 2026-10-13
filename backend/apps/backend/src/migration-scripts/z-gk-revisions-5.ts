import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createProductTagsWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import scents from "../data/scents.json"

const COLLECTIONS = ["Date Night", "Office Wear", "Casual", "Winter", "Summer"]

/**
 * The shop's five collections (October 2026). Each one is a product tag, so the owner can move a scent
 * in or out in Admin → Products → Tags. Runs once per product (metadata.gk_collections), then leaves it to the owner.
 * The old automatic "Summer"/"Winter" season tags are replaced by the hand-picked launch list.
 */
export default async function gk_revisions_5({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: tagRows } = await query.graph({ entity: "product_tag", fields: ["id", "value"] })
  const tagId = new Map(tagRows.map((t) => [t.value, t.id]))
  const missing = COLLECTIONS.filter((v) => !tagId.has(v))
  if (missing.length) {
    const { result } = await createProductTagsWorkflow(container).run({ input: { product_tags: missing.map((value) => ({ value })) } })
    result.forEach((t) => tagId.set(t.value, t.id))
  }

  const { data: products } = await query.graph({ entity: "product", fields: ["id", "handle", "metadata", "tags.id", "tags.value"] })
  let n = 0
  for (const p of products) {
    const s = scents.find((x) => x.slug === p.handle)
    const meta = (p.metadata ?? {}) as Record<string, unknown>
    if (!s || meta.gk_collections === "2026-10") {
      continue
    }
    const keep = ((p.tags ?? []).filter(Boolean) as { id: string; value: string }[]).filter((t) => !COLLECTIONS.includes(t.value))
    const add = (s.tags ?? []).filter((t) => COLLECTIONS.includes(t)).map((t) => tagId.get(t)!)
    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: p.id },
        update: { tag_ids: [...new Set([...keep.map((t) => t.id), ...add])], metadata: { ...meta, gk_collections: "2026-10" } },
      },
    })
    n++
  }
  if (n) {
    logger.info(`GK revisions: ${n} scents added to the Date Night / Office Wear / Casual / Winter / Summer collections`)
  }
}
