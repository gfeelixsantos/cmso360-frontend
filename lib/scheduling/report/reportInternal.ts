import { formatCPF } from "@/lib/utils";
import { Scheduling } from "../interface/scheduling";

const primaryColor = "#114F36" // verde escuro cmso
const secondaryColor = "#AFCA07" // verde claro cmso

export function reportInternal(employee: Scheduling): string {
        let examsTable:string = "";

        const allExams = ["ACUIDADE VISUAL", "AUDIOMETRIA", "AVALIAÇÃO PSICOSSOCIAL", "CLÍNICO", "PRESSÃO ARTERIAL", "ECG", "EEG", "ESPIROMETRIA", "LABORATÓRIO", "RAIO-X", "TOXICOLÓGICO"]

        allExams.forEach(item => {
            examsTable += 
            `
            <tr>
                <td style="padding: 12px; border: 1px solid #ddd;">
                    <input type="checkbox" style="transform: scale(2); margin-right: 15px;"  />
                    <span>${ item }</span>
                </td>
                <td style="padding: 12px; border: 1px solid #ddd;"></td>
                <td style="padding: 12px; border: 1px solid #ddd;"></td>
            </tr>
            `
        })
        



        return(
            `
               <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Agendamento - Centro Médico de Saúde Ocupacional</title>
                </head>
                <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; color: #2c3e50; background-color: white;">
                    <div style="width: 210mm; min-height: 297mm; margin: 0 auto; background-color: white; box-shadow: 0 0 20px rgba(0, 0, 0, 0.1); padding: 15mm;">
                        <!-- Cabeçalho com logo -->
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 25px; border-bottom: 2px solid ${ primaryColor }; padding-bottom: 15px;">
                            <tr>
                                <td valign="top">
                                    <!-- Informações do funcionário -->
                                    <div style="font-size: 24px; font-weight: bold; color: ${ primaryColor }; letter-spacing: 1px;">${ employee.NOME.toUpperCase() }</div>
                                    ${ employee.CPFFUNCIONARIO != "" ? 
                                        `
                                        <div style="font-size: 14px; color: #2c3e50; margin-top: 5px;">
                                            CPF: ${ formatCPF(employee.CPFFUNCIONARIO) }
                                        </div>
                                        `
                                        : ""
                                    }
                                    <!-- Linha para nome da empresa e tipo de exame -->
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 20px; color: #2c3e50; margin-top: 5px;">
                                        <tr>
                                            <td width="80%" style="font-size: 14px;">🏢${ employee.NOMEEMPRESA.toUpperCase() } - ${ employee.CODIGOEMPRESA }</td>
                                            <td width="20%" style="font-size: 14px;" align="left">${ employee.TIPOEXAMENOME.toUpperCase() }</td>
                                        </tr>
                                    </table>
                                    <!-- Linha para data, horário e cmso -->
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 20px; color: #2c3e50; margin-top: 5px; table-layout: fixed;">
                                        <tr>
                                            <td width="33%">📆 ${ employee.DATAAGENDAMENTO }</td>
                                            <td width="34%" align="center">⏱ ${ employee.HORARIO }hr</td>
                                            <td width="33%" align="left">📌 ${ employee.UNIDADEATENDIMENTO }</td>
                                        </tr>
                                    </table>
                                </td>
                                <td valign="top" align="right">
                                    <!-- Código do funcionário em destaque -->
                                    <div style="background-color: ${ primaryColor }; color: white; padding: 8px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
                                        <div style="font-size: 14px; margin-bottom: 5px;">CÓDIGO SOC</div>
                                        <div style="font-size: 24px; font-weight: bold;">${ employee.CODIGO }</div>
                                    </div>
                                </td>
                            </tr>
                        </table>
                        
                        <!-- Tabela de informações -->
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                            <tr>
                                <td style="padding: 10px; border: 1px solid #b2b2b2ff; background-color: #b2b2b2ff; font-weight: bold;">Cargo</td>
                                <td style="padding: 10px; border: 1px solid #b2b2b2ff; background-color: #b2b2b2ff; font-weight: bold;">Setor</td>
                                <td style="padding: 10px; border: 1px solid #b2b2b2ff; background-color: #b2b2b2ff; font-weight: bold;">Unidade</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #b2b2b2ff; font-size: 14px;">${ employee.NOMECARGO.toUpperCase() }</td>
                                <td style="padding: 10px; border: 1px solid #b2b2b2ff; font-size: 14px;">${ employee.NOMESETOR.toUpperCase() }</td>
                                <td style="padding: 10px; border: 1px solid #b2b2b2ff; font-size: 14px;">${ employee.NOMEUNIDADE.toUpperCase() }</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #b2b2b2ff; background-color: #b2b2b2ff; font-weight: bold;">Solicitante</td>
                                <td style="padding: 10px; border: 1px solid #b2b2b2ff; background-color: #b2b2b2ff; font-weight: bold;">E-mail</td>
                                <td style="padding: 10px; border: 1px solid #b2b2b2ff; background-color: #b2b2b2ff; font-weight: bold;">Contato</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #b2b2b2ff; font-size: 14px;">${ employee.CLIENT?.Name.toUpperCase() }</td>
                                <td style="padding: 10px; border: 1px solid #b2b2b2ff;">
                                    <a href="mailto:${ employee.CLIENT?.Email }">${ employee.CLIENT?.Email }</a>
                                </td>
                                <td style="padding: 10px; border: 1px solid #b2b2b2ff;">${ employee.CLIENT?.Phone }</td>
                            </tr>
                            ${ employee.OBSERVACOES ?
                                `<tr>
                                    <td colspan="3" style="padding: 10px; border: 1px solid #b2b2b2ff;">
                                        <span style="font-weight:bold">Observações: </span> 
                                        <span style="color:red;"> ${ employee.OBSERVACOES }</span>
                                    </td>
                                </tr>
                                ` : ""
                            }
                            ${employee.EXAMES.length > 0 && employee.EXAMES.some(exame => !exame.nomeExame.includes("eSocial")) ?
                                `<tr>
                                    <td colspan="3" style="padding: 10px; border: 1px solid #b2b2b2ff; font-size: 10px"">
                                        <span style="font-weight: bold">Exames solicitados:</span>
                                        ${employee.EXAMES
                                            .filter(exame => !exame.nomeExame.includes("eSocial"))
                                            .map(exame => `<span style="color:white; background-color:${secondaryColor}; border-radius: 50px; padding: 5px 10px; margin: 5px; white-space: nowrap; display: inline-block;">${exame.nomeExame}</span>`)
                                            .join(' ')
                                        }
                                    </td>
                                </tr>`
                                : ""
                            }
                        </table>

                        
                        <!-- Tabela exames -->
                        <table style="width: 100%; border-collapse: collapse; border: 1px solid #b2b2b2ff;">
                            <thead>
                                <tr>
                                    <th style="padding: 12px; border: 1px solid #b2b2b2ff; color: black; background-color: #b2b2b2ff; font-weight:bolder; font-size:14px; ">Atendente</th>
                                    <th style="padding: 12px; border: 1px solid #b2b2b2ff; color: black; background-color: #b2b2b2ff;font-weight:bolder; font-size:14px">Biometria</th>
                                    <th style="padding: 12px; border: 1px solid #b2b2b2ff; color: black; background-color: #b2b2b2ff;font-weight:bolder; font-size:14px">Horário</th>
                                </tr>
                                <tr>
                                    <td style="padding: 20px; border: 1px solid #b2b2b2ff;"></td>
                                    <td style="padding: 20px; border: 1px solid #b2b2b2ff;"></td>
                                    <td style="padding: 20px; border: 1px solid #b2b2b2ff;"></td>
                                </tr>
                                <tr>
                                    <th style="padding: 12px; border: 1px solid #b2b2b2ff; color: black; background-color: #b2b2b2ff;font-weight:bolder; font-size:14px">Etiqueta</th>
                                    <th style="padding: 12px; border: 1px solid #b2b2b2ff; color: black; background-color: #b2b2b2ff;font-weight:bolder; font-size:14px">Visto</th>
                                    <th style="padding: 12px; border: 1px solid #b2b2b2ff; color: black; background-color: #b2b2b2ff;font-weight:bolder; font-size:14px">Horário</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ examsTable }
                            </tbody>
                            <tfoot>
                                <th style="padding: 12px; border: 1px solid #b2b2b2ff; color: black; background-color: #b2b2b2ff;font-weight:bolder; font-size:14px" colspan="3">Finalização</th>
                                <tr>
                                    <td style="padding: 12px; border: 1px solid #b2b2b2ff;">Assinatura: </td>
                                    <td style="padding: 12px; border: 1px solid #b2b2b2ff;">Horário: </td>
                                    <td style="padding: 12px; border: 1px solid #b2b2b2ff;">Telefone: </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </body>
                </html>
            `
        )
    }