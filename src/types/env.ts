import z from "zod";

export const env = z.object({
  VITE_BASE_URL: z.string().default("http://localhost:3333")
})