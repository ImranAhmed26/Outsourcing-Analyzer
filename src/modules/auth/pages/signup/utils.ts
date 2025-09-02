import { z } from "zod";

// Zod schema
export const signupFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    email: z.email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/\d/, "Password must include a number")
      .regex(/[^A-Za-z0-9]/, "Password must include a symbol"),
    confirmPassword: z.string(),
    terms: z
      .boolean()
      .refine(
        (v) => v === true,
        "You must agree to the Terms and Privacy Policy"
      ),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export type SignupFormData = z.infer<typeof signupFormSchema>;

export const signupFormDefaultValues: SignupFormData = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  terms: false,
};
