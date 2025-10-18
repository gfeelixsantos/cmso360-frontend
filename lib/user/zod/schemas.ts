import { z } from "zod"

export const userRegisterSchema = z.object({
  cpf: z.string().min(14),
  codigo: z.string().min(1),
  password: z.string().min(3),
});
export type IUserRegister = z.infer<typeof userRegisterSchema>;




export const userLoginSchema = z.object({
  cpf: z.string().min(14),
  password: z.string(),
})
export type IUserLogin = z.infer<typeof userLoginSchema>;