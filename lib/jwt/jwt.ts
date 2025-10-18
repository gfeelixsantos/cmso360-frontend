import { SignJWT, jwtVerify } from "jose";
import { IUserInfo } from "../user/interfaces/IUser";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export class JWT {
  static async generateJwt(userInfo: any) {
    return await new SignJWT(userInfo)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(secret);
  }

  static async verifyJwt(token: string) {
    try {
      const { payload } = await jwtVerify(token, secret);
      return payload;
    } catch (err) {
      console.error("Erro ao verificar JWT:", err);
      return null;
    }
  }
}
