import z from "zod";
export declare const SignUpSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, z.z.core.$strip>;
