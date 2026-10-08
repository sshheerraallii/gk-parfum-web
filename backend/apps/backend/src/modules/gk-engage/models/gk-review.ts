import { model } from "@medusajs/framework/utils"

/** Customer reviews. Nothing appears on the site until it's approved in Admin → Reviews. */
const GkReview = model.define("gk_review", {
  id: model.id().primaryKey(),
  product_handle: model.text().nullable(),
  name: model.text(),
  email: model.text(),
  rating: model.number(),
  title: model.text().nullable(),
  body: model.text(),
  verified: model.boolean().default(false),
  status: model.enum(["pending", "approved", "rejected"]).default("pending"),
})

export default GkReview
