import { ICadastroPessoas } from "../interfaces/ICadastroPessoas";

const SOC_ED_CADASTRO_PESSOAS_URL = process.env.SOC_ED_CADASTRO_PESSOAS_URL;

export class SOC {
  public static async ExportaDadosCadastroPessoas() {
    const response = await fetch(SOC_ED_CADASTRO_PESSOAS_URL!);

    if (response.ok) {
      const listaCadastroPessoas: ICadastroPessoas[] = await response.json();

      return listaCadastroPessoas;
    }

    return null;
  }
}
