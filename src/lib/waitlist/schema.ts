import { z } from "zod";
import { COUNTRY_OPTIONS, ROLE_OPTIONS } from "@/lib/content";
import { WAITLIST_SOURCES } from "./constants";

export const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  role: z.enum(ROLE_OPTIONS),
  // Country is optional in the modal and absent from the home page form.
  country: z
    .union([z.enum(COUNTRY_OPTIONS), z.literal("")])
    .optional()
    .transform((c) => c || null),
  survey: z.boolean().default(false),
  source: z.enum(WAITLIST_SOURCES),
});
