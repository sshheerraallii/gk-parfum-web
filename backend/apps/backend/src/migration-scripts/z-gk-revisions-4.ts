import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import scents from "../data/scents.json"

/**
 * Amber Levant: notes corrected to match Louis Vuitton Ambre Levant (October 2026).
 * Only touches that one product, and only if its notes haven't been edited in the admin since.
 */
export default async function gk_revisions_4({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const s = scents.find((x) => x.slug === "amber-levant")
  const { data } = await query.graph({ entity: "product", fields: ["id", "metadata"], filters: { handle: "amber-levant" } })
  const p = data[0]
  if (!s || !p) {
    return
  }
  const meta = (p.metadata ?? {}) as Record<string, unknown>
  // the notes the previous update wrote — anything else means the owner has changed them
  if (meta.notes_top !== "Ginger, Pepper, Cinnamon, Cardamom") {
    return
  }
  await updateProductsWorkflow(container).run({
    input: {
      selector: { id: p.id },
      update: {
        description: s.description,
        metadata: {
          ...meta,
          notes_top: s.notes.top.join(", "),
          notes_heart: s.notes.heart.join(", "),
          notes_base: s.notes.base.join(", "),
          one_liner: s.oneLiner,
        },
      },
    },
  })
  logger.info("GK revisions: Amber Levant notes updated")
}
