import { NextRequest, NextResponse } from "next/server";

import { IUserRegister } from "@/lib/user/interfaces/IUser";
import { UserService } from "@/lib/user/services/user.service";
import { userRegisterSchema } from "@/lib/user/zod/schemas";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data: IUserRegister = userRegisterSchema.parse(body);

  const response = await UserService.register(data);

  return NextResponse.json(response);
}
