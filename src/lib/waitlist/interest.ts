import { z } from "zod";
import { CLIENT_COUNTS, CLINICIAN_ROLES, COLLEGE_ROLES, COUNTRY_OPTIONS, STUDENT_COUNTS } from "@/lib/content";

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
const name = z.string().trim().min(1).max(200);
/** An optional free-text answer. Blank is stored as no answer. */
const openText = z.string().trim().max(2000).optional().transform((s) => s || null);
/** An optional pick from a list. The form sends "" when nothing is picked. */
const pick = (options: string[]) =>
  z
    .union([z.enum(options), z.literal("")])
    .optional()
    .transform((v) => v || null);

export const interestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("clinician"),
    name,
    email,
    role: z.enum(CLINICIAN_ROLES),
    country: pick(COUNTRY_OPTIONS),
    clients: pick(CLIENT_COUNTS),
    note: openText,
  }),
  z.object({
    type: z.literal("college"),
    name,
    email,
    college: z.string().trim().min(1).max(200),
    role: z.enum(COLLEGE_ROLES),
    students: pick(STUDENT_COUNTS),
    message: openText,
  }),
]);
