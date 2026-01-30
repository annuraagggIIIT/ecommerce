import z from "zod";

export const SignUpSchema = z.object({
    name: z.string(),
    email: z.email(),
    password: z.string().min(6)
});