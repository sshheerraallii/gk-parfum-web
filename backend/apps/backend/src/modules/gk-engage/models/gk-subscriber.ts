import { model } from "@medusajs/framework/utils"

/** Newsletter sign-ups from the "win a free bottle" pop-up and the footer. */
const GkSubscriber = model.define("gk_subscriber", {
  id: model.id().primaryKey(),
  email: model.text().unique(),
  phone: model.text().nullable(),
  source: model.text().default("popup"),
  in_prize_draw: model.boolean().default(true),
})

export default GkSubscriber
