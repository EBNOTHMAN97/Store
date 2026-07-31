import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_qrxkA64fiMbu@ep-odd-voice-zauew3da-pooler.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  },
} satisfies Config;
