'use server'
import { JWT } from "@/lib/jwt/jwt"
import { IUserInfo } from "@/lib/user/interfaces/IUser"
import { UserService } from "@/lib/user/services/user.service"
import { userLoginSchema } from "@/lib/user/zod/schemas"
import { ApiMessages } from "@/shared/responses/ApiMessages"
import { ApiResponse, IApiResponse } from "@/shared/responses/ApiResponse"
import { HttpCodes } from "@/shared/responses/HttpCodes"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function POST(req: NextRequest): Promise<NextResponse<IApiResponse<IUserInfo>>> {
  try {
    const body = await req.json()
    const data = userLoginSchema.parse(body)


    const userLogged = await UserService.login(data)
    const { token, userInfo } = userLogged?.data!

    if (!token) {
      return NextResponse.json(new ApiResponse(HttpCodes.UNAUTHORIZED, ApiMessages.USER_INPUT_INVALID))
    }

    const ck = await cookies() 
    ck.set("auth_token", token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hora
    })
    
    return NextResponse.json(new ApiResponse(HttpCodes.OK, ApiMessages.USER_LOGGED_IN_SUCCESSFULLY, userInfo )) 

  } catch (err) {
    console.error(err)
    return NextResponse.json(new ApiResponse(HttpCodes.INTERNAL_SERVER_ERROR, ApiMessages.INTERNAL_ERROR))
  }
}



export async function GET() {
    const ck = await cookies()
    const token = ck.get("auth_token")?.value

  if (!token) return NextResponse.json({ user: null }, { status: 401 })

  try {
    const payload = await JWT.verifyJwt(token)
    return NextResponse.json({ user: payload })
  } catch {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
