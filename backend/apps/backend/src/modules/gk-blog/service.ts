import { MedusaService } from "@medusajs/framework/utils"
import GkPost from "./models/gk-post"

class GkBlogService extends MedusaService({ GkPost }) {}

export default GkBlogService
