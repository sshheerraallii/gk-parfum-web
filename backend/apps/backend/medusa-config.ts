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

// Product photos uploaded in the admin. Without S3 settings they're saved on the server's own disk,
// which free hosts wipe on every restart — so on Render, point these at a free Supabase Storage bucket.
if (process.env.S3_BUCKET) {
  modules.push({
    resolve: "@medusajs/medusa/file",
    options: {
      providers: [
        {
          resolve: "@medusajs/medusa/file-s3",
          id: "s3",
          options: {
            file_url: process.env.S3_FILE_URL,
            access_key_id: process.env.S3_ACCESS_KEY_ID,
            secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
            region: process.env.S3_REGION || "eu-west-2",
            bucket: process.env.S3_BUCKET,
            endpoint: process.env.S3_ENDPOINT,
            // Supabase buckets are made public in its dashboard, so no per-file ACL header
            acl: false,
            additional_client_config: { forcePathStyle: true },
          },
        },
      ],
    },
  })
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Hosted Postgres (Supabase, Neon, Render) wants TLS; set DATABASE_SSL=true there.
    ...(process.env.DATABASE_SSL === "true"
      ? { databaseDriverOptions: { connection: { ssl: { rejectUnauthorized: false } } } }
      : {}),
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
