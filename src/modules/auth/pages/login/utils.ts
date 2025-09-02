import { z } from "zod";

export const loginFormSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

export const loginFormDefaultValues: LoginFormData = {
  email: "",
  password: "",
};
