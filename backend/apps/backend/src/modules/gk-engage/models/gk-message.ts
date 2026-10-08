import { model } from "@medusajs/framework/utils"

/** Messages sent from the contact page. */
const GkMessage = model.define("gk_message", {
  id: model.id().primaryKey(),
  name: model.text(),
  email: model.text(),
  order_ref: model.text().nullable(),
  message: model.text(),
  status: model.enum(["new", "replied", "archived"]).default("new"),
})

export default GkMessage
