import { IUserLogin, IUserInfo, IUserRegister } from "../interfaces/IUser";

import { Bcrypt } from "@/lib/bcrypt/bcrypt";
import { SOC } from "@/lib/soc/services/soc";
import { SupabaseService } from "@/lib/supabase/services/supabase.service";
import { ApiMessages } from "@/shared/responses/ApiMessages";
import { ApiResponse } from "@/shared/responses/ApiResponse";
import { HttpCodes } from "@/shared/responses/HttpCodes";
import { JWT } from "@/lib/jwt/jwt";
import { mapCadastroPessoasToUserInfo } from "@/lib/utils";

/**
 * Service responsável por lidar com regras de negócio relacionadas a Usuários.
 *
 * - Encapsula operações de autenticação (`login`) e cadastro (`register`).
 * - Faz integração com:
 *   - Supabase (persistência de usuários).
 *   - SOC (sistema legado de cadastro de pessoas).
 *   - Utilitários (bcrypt para senha, JWT para token).
 * - Retorna sempre instâncias de ApiResponse<T> padronizando a comunicação.
 */
export class UserService {
  /**
   * Autentica um usuário com base no CPF e senha.
   *
   * Fluxo:
   *  1. Busca o usuário no Supabase.
   *  2. Valida se o usuário existe.
   *  3. Compara a senha informada com o hash salvo.
   *  4. Consulta o cadastro de pessoas no SOC.
   *  5. Gera JWT e retorna objeto com dados do usuário + token.
   *
   * @param user Dados de login (cpf, senha).
   * @returns ApiResponse<IUserLoginSuccess> em caso de sucesso,
   *          ou ApiResponse<null> com erro apropriado.
   */
  static async login(
    user: IUserLogin,
  ): Promise<ApiResponse<{ token: string; userInfo: IUserInfo }>> {
    // Busca usuário por CPF no Supabase
    const userRegister = await SupabaseService.getUserByCpf(user.cpf);

    if (!userRegister) {
      return new ApiResponse(
        HttpCodes.BAD_REQUEST,
        ApiMessages.USER_INPUT_INVALID,
      );
    }

    // Valida senha utilizando bcrypt
    const passwordIsValid = await Bcrypt.comparePasswords(
      user.password,
      userRegister.password,
    );

    if (!passwordIsValid) {
      return new ApiResponse(
        HttpCodes.UNAUTHORIZED,
        ApiMessages.USER_INPUT_INVALID,
      );
    }

    // Busca informações complementares no SOC
    const cadastroPessoas = await SOC.ExportaDadosCadastroPessoas();
    const socUser = cadastroPessoas?.find(
      (p) => p.CODIGO == userRegister.codigo,
    );

    if (!socUser) {
      return new ApiResponse(
        HttpCodes.UNPROCESSABLE_ENTITY,
        ApiMessages.SOC_ED_CADASTRO_PESSOAS_NULL,
      );
    }

    // Gera token JWT e mapeia para o modelo de sucesso de login
    const userInfo = mapCadastroPessoasToUserInfo(socUser);
    const token = await JWT.generateJwt(userInfo);

    return new ApiResponse(
      HttpCodes.OK,
      ApiMessages.USER_LOGGED_IN_SUCCESSFULLY,
      { token: token, userInfo: userInfo },
    );
  }

  /**
   * Registra um novo usuário no sistema.
   *
   * Fluxo:
   *  1. Em paralelo:
   *      - Busca cadastro de pessoas no SOC.
   *      - Verifica se CPF já existe no Supabase.
   *  2. Se usuário já existe → retorna conflito (409).
   *  3. Se não existe no SOC → retorna not found (404).
   *  4. Gera hash da senha.
   *  5. Cria usuário no Supabase.
   *  6. Retorna dados de usuário mapeados.
   *
   * @param user Dados do usuário a serem cadastrados.
   * @returns ApiResponse<IUserInfo> ou erro apropriado.
   */
  static async register(user: IUserRegister) {
    try {
      // Executa duas chamadas em paralelo para otimizar tempo de resposta
      const [cadastroPessoas, supabaseData] = await Promise.all([
        SOC.ExportaDadosCadastroPessoas(),
        SupabaseService.getUserByCpf(user.cpf),
      ]);

      if (!cadastroPessoas) {
        return new ApiResponse(
          HttpCodes.INTERNAL_SERVER_ERROR,
          ApiMessages.SOC_ED_CADASTRO_PESSOAS_NULL,
          null,
        );
      }

      if (supabaseData?.cpf) {
        return new ApiResponse(
          HttpCodes.CONFLICT,
          ApiMessages.USER_ALREADY_EXISTS,
          null,
        );
      }

      // Confere se usuário realmente existe no SOC
      const socRegisterUser = cadastroPessoas.find(
        (item) => item.CODIGO === user.codigo && item.CPF === user.cpf,
      );

      if (!socRegisterUser) {
        return new ApiResponse(
          HttpCodes.NOT_FOUND,
          ApiMessages.SOC_CADASTRO_PESSOA_NOT_FOUND,
          null,
        );
      }

      // Criptografa senha antes de persistir
      user.password = await Bcrypt.createHash(user.password);

      // Cria usuário no Supabase
      const statusCode = await SupabaseService.createClient(user);

      if (statusCode != HttpCodes.CREATED) {
        return new ApiResponse(
          HttpCodes.UNPROCESSABLE_ENTITY,
          ApiMessages.USER_REGISTER_FAILED,
          null,
        );
      }

      // Mapeia para DTO de resposta
      const userInfoMapped = mapCadastroPessoasToUserInfo(socRegisterUser);

      return new ApiResponse(
        HttpCodes.CREATED,
        ApiMessages.USER_REGISTERED_SUCCESSFULLY,
        userInfoMapped,
      );
    } catch (err) {
      console.error(err);

      return new ApiResponse(
        HttpCodes.INTERNAL_SERVER_ERROR,
        ApiMessages.INTERNAL_ERROR,
        null,
      );
    }
  }

  static async validateRecoveryCode(
    cpf: string,
    codigoRecuperacao: string,
  ): Promise<ApiResponse<{ valid: boolean }>> {
    const userRegister = await SupabaseService.getUserByCpf(cpf);

    if (!userRegister) {
      return new ApiResponse(
        HttpCodes.BAD_REQUEST,
        "CPF ou código de recuperação inválidos",
        { valid: false },
      );
    }

    const normalizeCpf = (value: string) => value.replace(/\D/g, "");
    const cpfBancoNormalizado = normalizeCpf(userRegister.cpf);
    const ultimos2Cpf = cpfBancoNormalizado.slice(-2);

    const codigoBase = String(userRegister.codigo).split("").reverse().join("");
    const codigoEsperado = `${codigoBase}${ultimos2Cpf}`;

    const isValid = codigoEsperado === codigoRecuperacao;

    return new ApiResponse(
      isValid ? HttpCodes.OK : HttpCodes.UNAUTHORIZED,
      isValid
        ? "Código validado com sucesso"
        : "CPF ou código de recuperação inválidos",
      { valid: isValid },
    );
  }

  static async resetPassword(
    cpf: string,
    novaSenha: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const userRegister = await SupabaseService.getUserByCpf(cpf);

    if (!userRegister) {
      return new ApiResponse(
        HttpCodes.BAD_REQUEST,
        ApiMessages.USER_INPUT_INVALID,
        { success: false },
      );
    }

    const hashedPassword = await Bcrypt.createHash(novaSenha);
    const updated = await SupabaseService.updatePassword(cpf, hashedPassword);

    if (!updated) {
      return new ApiResponse(
        HttpCodes.INTERNAL_SERVER_ERROR,
        ApiMessages.INTERNAL_ERROR,
        { success: false },
      );
    }

    return new ApiResponse(HttpCodes.OK, "Senha atualizada com sucesso", {
      success: true,
    });
  }
}
