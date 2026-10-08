import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const modules: { resolve: string; options?: Record<string, unknown> }[] = [
  { resolve: "./src/modules/gk-settings" },
  { resolve: "./src/modules/gk-engage" },
]

// Card, Apple Pay, Google Pay, PayPal and Klarna all run through Stripe's Payment Element.
// Turn individual methods on in the Stripe dashboard → Settings → Payment methods.
if (process.env.STRIPE_API_KEY) {
  modules.push({
    resolve: "@medusajs/medusa/payment",
    options: {
      providers: [
        {
          resolve: "@medusajs/medusa/payment-stripe",
          id: "stripe",
          options: {
            apiKey: process.env.STRIPE_API_KEY,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            capture: true,
            automatic_payment_methods: true,
          },
        },
      ],
    },
  })
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL || "/",
  },
  modules,
})
