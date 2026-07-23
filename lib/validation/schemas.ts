import { z } from "zod";

/**
 * Shared Zod schemas. Used by React Hook Form on the client and
 * re-validated inside every server action / route handler.
 */

const nameField = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80, "Too long")
  .regex(/^[^<>{}]*$/, "Invalid characters");

export const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254)
  .email("Enter a valid email address");

export const phoneField = z
  .string()
  .trim()
  .max(25)
  .regex(/^[0-9()+\-.\s]*$/, "Enter a valid phone number")
  .optional()
  .or(z.literal(""));

export const INTEREST_OPTIONS = [
  "Opening announcements",
  "Simulator reservations",
  "Men's leagues",
  "Ladies' leagues",
  "Couples leagues",
  "Youth programs",
  "Senior play",
  "Business leagues",
  "Church leagues",
  "Lessons",
  "Tournaments",
  "Special events",
  "Memberships",
  "Private rentals",
] as const;

export const interestSchema = z.object({
  first_name: nameField,
  last_name: nameField,
  email: emailField,
  phone: phoneField,
  interests: z.array(z.enum(INTEREST_OPTIONS)).max(INTEREST_OPTIONS.length).default([]),
  email_consent: z
    .boolean()
    .refine((v) => v, "Please confirm you'd like to receive email updates"),
  sms_consent: z.boolean().default(false),
  /** Honeypot — humans leave this empty; bots fill it. */
  company: z.string().max(200).optional(),
});

export type InterestInput = z.infer<typeof interestSchema>;

export const signupSchema = z.object({
  first_name: nameField,
  last_name: nameField,
  email: emailField,
  password: z
    .string()
    .min(10, "Use at least 10 characters")
    .max(128)
    .regex(/[a-zA-Z]/, "Include at least one letter")
    .regex(/[0-9]/, "Include at least one number"),
  marketing_email_consent: z.boolean().default(false),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required").max(128),
});

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(10, "Use at least 10 characters")
      .max(128)
      .regex(/[a-zA-Z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

export const profileSchema = z.object({
  first_name: nameField,
  last_name: nameField,
  phone: phoneField,
  handedness: z.enum(["left", "right", "either"]).nullable().optional(),
  skill_level: z
    .enum(["new", "beginner", "intermediate", "advanced", "competitive"])
    .nullable()
    .optional(),
  date_of_birth: z.string().date().nullable().optional().or(z.literal("")),
  accessibility_notes: z.string().max(1000).optional(),
  marketing_email_consent: z.boolean().default(false),
  marketing_sms_consent: z.boolean().default(false),
});

export const bookingDetailsSchema = z.object({
  player_count: z.number().int().min(1).max(12),
  skill_level: z.enum(["new", "beginner", "intermediate", "advanced"]).optional(),
  bringing_clubs: z.boolean().default(true),
  club_rental_required: z.boolean().default(false),
  first_time: z.boolean().default(false),
  accessibility_needs: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export type BookingDetailsInput = z.infer<typeof bookingDetailsSchema>;

export const availabilityQuerySchema = z.object({
  date: z.string().date(),
  duration_minutes: z.number().int().min(30).max(240),
  player_count: z.number().int().min(1).max(12),
});

export const createHoldSchema = z.object({
  bay_id: z.string().uuid(),
  starts_at: z.string().datetime({ offset: true }),
  duration_minutes: z.number().int().min(30).max(240),
});

export const privateEventInquirySchema = z.object({
  contact_name: nameField,
  organization: z.string().trim().max(120).optional().or(z.literal("")),
  email: emailField,
  phone: phoneField,
  event_type: z.enum([
    "Birthday",
    "Corporate outing",
    "Team building",
    "Church group",
    "Fundraiser",
    "Family gathering",
    "Youth party",
    "Private tournament",
    "Holiday event",
    "Other",
  ]),
  preferred_date: z.string().date().optional().or(z.literal("")),
  alternate_date: z.string().date().optional().or(z.literal("")),
  preferred_time: z.string().max(40).optional().or(z.literal("")),
  guest_count: z.number().int().min(1).max(500).optional(),
  bay_count: z.number().int().min(1).max(10).optional(),
  food_and_drink_needs: z.string().max(1000).optional(),
  budget_range: z.string().max(60).optional().or(z.literal("")),
  accessibility_needs: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  company: z.string().max(200).optional(), // honeypot
});

export type PrivateEventInquiryInput = z.infer<typeof privateEventInquirySchema>;

export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  subject: z.string().trim().min(1, "Required").max(150),
  message: z.string().trim().min(10, "Tell us a little more").max(3000),
  company: z.string().max(200).optional(), // honeypot
});

export const giftCardPurchaseSchema = z.object({
  amount_cents: z
    .number()
    .int()
    .min(1000, "Minimum gift card is $10")
    .max(50000, "Maximum gift card is $500"),
  recipient_name: nameField,
  recipient_email: emailField,
  delivery_date: z.string().date().optional().or(z.literal("")),
  personal_message: z.string().max(500).optional(),
});

export const householdMemberSchema = z.object({
  first_name: nameField,
  last_name: nameField,
  date_of_birth: z.string().date().optional().or(z.literal("")),
  relationship: z.enum(["spouse", "partner", "child", "dependent", "other"]),
  emergency_contact_name: z.string().trim().max(120).optional().or(z.literal("")),
  emergency_contact_phone: phoneField,
  notes: z.string().max(500).optional(),
});

export const youthRegistrationSchema = z.object({
  program_id: z.string().uuid(),
  household_member_id: z.string().uuid(),
  emergency_contact_name: z.string().trim().min(1, "Required").max(120),
  emergency_contact_phone: z
    .string()
    .trim()
    .min(7, "Required")
    .max(25)
    .regex(/^[0-9()+\-.\s]*$/, "Enter a valid phone number"),
  medical_notes: z.string().max(1000).optional(),
  photo_consent: z.boolean().default(false),
  waiver_accepted: z
    .boolean()
    .refine((v) => v, "The participation waiver must be accepted"),
});
