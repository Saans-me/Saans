import { z } from "zod";
import { COUNTRY_OPTIONS, ROLE_OPTIONS } from "@/lib/content";
import { STRUGGLES_MAX, WAITLIST_SOURCES } from "./constants";

export const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  role: z.enum(ROLE_OPTIONS),
  // Country is optional on both forms.
  country: z
    .union([z.enum(COUNTRY_OPTIONS), z.literal("")])
    .optional()
    .transform((c) => c || null),
  // Optional, in the person's own words. Blank is stored as no answer.
  struggles: z
    .string()
    .trim()
    .max(STRUGGLES_MAX)
    .optional()
    .transform((s) => s || null),
  survey: z.boolean().default(false),
  source: z.enum(WAITLIST_SOURCES),
});
