import { count } from "node:console";
import z from "zod";

export const SignUpSchema = z.object({
    name: z.string(),
    email: z.email(),
    password: z.string().min(6),
    role: z.enum(['ADMIN', 'USER']).default('USER')
});
export const AddressSchema = z.object({
    lineOne: z.string(),
    lineTwo: z.string().optional(),
    pinCode: z.string(),
    country: z.string(),
    city: z.string()
});
export const UpdateUserSchema = z.object({
    name: z.string().optional(),
    defaultShippingAddressId: z.number().optional(),
    defaultBillingAddressId: z.number().optional()
});