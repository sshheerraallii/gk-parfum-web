import { MedusaService } from "@medusajs/framework/utils"
import GkSearch from "./models/gk-search"
import GkSubscriber from "./models/gk-subscriber"
import GkMessage from "./models/gk-message"
import GkReview from "./models/gk-review"

class GkEngageService extends MedusaService({ GkSearch, GkSubscriber, GkMessage, GkReview }) {}

export default GkEngageService
