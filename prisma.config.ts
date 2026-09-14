import { loadEnvFile } from "node:process";

import { defineConfig } from "prisma/config";

try {
  loadEnvFile();
} catch {
  // Missing .env is fine in environments that provide DATABASE_URL directly.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});