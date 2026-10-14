import { Module } from "@medusajs/framework/utils"
import GkBlogService from "./service"

export const GK_BLOG_MODULE = "gk_blog"

export default Module(GK_BLOG_MODULE, { service: GkBlogService })
