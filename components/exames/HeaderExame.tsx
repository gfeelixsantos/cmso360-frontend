import { SECOND_COLOR } from "@/config/constants";
import { Scheduling } from "@/lib/scheduling/interface/scheduling";
import { Input } from "@heroui/input";
import { Card } from "@heroui/react";
import { Eye } from "lucide-react";

interface HeaderExameProp{
    agendamento?:Scheduling, exame: string
}
export default function HeaderExame({ agendamento, exame}: HeaderExameProp) {

    return(
        <div>
            {/* 1. Dados do Atendimento / Funcionário */}
            <Card className={`p-6 shadow-none border border-gray-200 bg-white w-full`}>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="text-center lg:text-left">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                        {exame || 'Exame Ocupacional'}
                    </h1>
                </div>
                <div>
                    <img 
                        src="/images/cmso_icone.png"
                        width={80}
                    />
                </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-600">Informações cadastrais</span>
                </div>
            </div>

            <div>
                {/* Dados Pessoais */}
                <div className="p-4 rounded-lg ">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                    <Input
                        value={agendamento?.NOME}
                        isReadOnly
                        className="bg-white border-gray-300"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                    <Input
                        value={agendamento?.CPFFUNCIONARIO}
                        isReadOnly
                        className="bg-white border-gray-300"
                        placeholder="000.000.000-00"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Nascimento</label>
                    <Input
                        value={agendamento?.DATANASCIMENTO ?? ""}
                        isReadOnly
                        className="bg-white border-gray-300"
                        placeholder="DD/MM/AAAA"
                    />
                    </div>
                </div>
                </div>
    
                {/* Dados Profissionais */}
                <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                    <Input
                        value={agendamento?.NOMECARGO}
                        isReadOnly
                        className="bg-white border-gray-300"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Setor</label>
                    <Input
                        value={agendamento?.NOMESETOR}
                        isReadOnly
                        className="bg-white border-gray-300"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Exame</label>
                    <Input
                        value={agendamento?.TIPOEXAMENOME}
                        isReadOnly
                        className="bg-white border-gray-300"
                    />
                    </div>
                </div>
                </div>
    
                {/* Dados da Empresa */}
                <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
                    <Input
                        value={agendamento?.NOMEEMPRESA}
                        isReadOnly
                        className="bg-white border-gray-300"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                    <Input
                        value={agendamento?.CNPJEMPRESA}
                        isReadOnly
                        className="bg-white border-gray-300"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unidade</label>
                    <Input
                        value={agendamento?.NOMEUNIDADE}
                        isReadOnly
                        className="bg-white border-gray-300"
                    />
                    </div>
                </div>
                </div>
            </div>
            </Card>
        </div>
    )
}