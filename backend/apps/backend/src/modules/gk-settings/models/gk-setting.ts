import { model } from "@medusajs/framework/utils"

/** Key/value store for shop-wide switches the owner edits in Admin → Offers. */
const GkSetting = model.define("gk_setting", {
  id: model.id().primaryKey(),
  key: model.text().unique(),
  value: model.json(),
})

export default GkSetting
