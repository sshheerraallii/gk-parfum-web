import { model } from "@medusajs/framework/utils"

/** What shoppers typed into "Which perfume do you love?" and the search page. */
const GkSearch = model.define("gk_search", {
  id: model.id().primaryKey(),
  query: model.text(),
  keywords: model.json(),
  results: model.number().default(0),
  source: model.text().default("matcher"),
})

export default GkSearch
