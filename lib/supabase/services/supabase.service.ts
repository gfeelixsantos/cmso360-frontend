import { IUserRegister } from "@/lib/user/interfaces/IUser";
import { supabase } from "../supabase";

export class SupabaseService {


  static async getUserByCpf(cpf: string): Promise<IUserRegister> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("cpf", cpf)
      .maybeSingle();

    if (error) {
      console.error("Error fetching client:", error);
    }
    return data;
  }

  // Cria novo cliente
  static async createClient(client: IUserRegister): Promise<number> {
    const { status, error } = await supabase
      .from("clients")
      .insert([client])
      .select("*")
      .single();

    if (error) {
      throw new Error("Failed to register client", error);
    }

    return status;
  }

  static async deleteUserByCPF(cpf: string) {
  try {
    const { error } = await supabase
      .from("clients") 
      .delete()
      .eq("cpf", cpf);

    if (error) {
      throw new Error(`Erro ao deletar usuário: ${error.message}`);
    }

    return {
      status: 200,
      message: "Usuário deletado com sucesso",
    };
  } catch (err: any) {
    return {
      status: 500,
      message: err.message || "Erro inesperado",
    };
  }
}
}
