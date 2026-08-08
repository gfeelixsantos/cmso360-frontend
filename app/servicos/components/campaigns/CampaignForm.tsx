"use client";

import { useState, useEffect, useRef } from "react";
import { Button, Input, RadioGroup, Radio, Select, SelectItem } from "@heroui/react";
import { EmailBuilder, EmailBuilderRef } from "./EmailBuilder";
import { campaignsClient } from "@/lib/campaigns/campaigns-client";
import { ArrowLeft, Save } from "lucide-react";
import { getCurrentUser } from "@/lib/utils";

interface CampaignFormProps {
  initialData?: any;
  onBack: () => void;
  onSave: () => void;
}

export function CampaignForm({ initialData, onBack, onSave }: CampaignFormProps) {
  const user = getCurrentUser();
  const [name, setName] = useState(initialData?.name || '');
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [fromName, setFromName] = useState(initialData?.from_name || '');
  const [replyTo, setReplyTo] = useState(initialData?.reply_to || '');
  const [scope, setScope] = useState(initialData?.scope || 'all');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(initialData?.selected_company_codes || []);
  const [companiesList, setCompaniesList] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const emailBuilderRef = useRef<EmailBuilderRef>(null);

  useEffect(() => {
    if (scope === 'selected' && companiesList.length === 0) {
      loadCompanies();
    }
  }, [scope]);

  const loadCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const data = await campaignsClient.getCompanies();
      setCompaniesList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const [searchCompany, setSearchCompany] = useState('');

  // Filter companies based on search
  const filteredCompanies = companiesList.filter(c => 
    !selectedCompanies.includes(String(c.CODIGO)) &&
    (c.RAZAOSOCIAL?.toLowerCase().includes(searchCompany.toLowerCase()) || 
     c.NOMEFANTASIA?.toLowerCase().includes(searchCompany.toLowerCase()) ||
     String(c.CODIGO).includes(searchCompany))
  );

  // Get selected company objects for the right column
  const selectedCompanyObjects = selectedCompanies.map(code => 
    companiesList.find(c => String(c.CODIGO) === code) || { CODIGO: code, RAZAOSOCIAL: `Empresa ${code}` }
  );

  const toggleCompany = (code: string) => {
    setSelectedCompanies(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      if (!emailBuilderRef.current) {
        throw new Error("Editor não foi carregado.");
      }
      
      // Request HTML and Design from Unlayer
      emailBuilderRef.current.exportHtml(async (data) => {
        const { design, html } = data;
        
        try {
          const payload = {
            name,
            subject,
            fromName: fromName,
            replyTo: replyTo,
            scope,
            selectedCompanyCodes: scope === 'selected' ? selectedCompanies : [],
            htmlBody: html,
            textBody: 'Por favor, visualize este e-mail em um cliente de e-mail moderno que suporte HTML.',
            editorSource: design,
            requestedByCodigo: String(user?.codigo || user?.nome || 'Sistema'),
            requestedByNome: String(user?.nome || 'Sistema'),
          };

          if (initialData?.id) {
            await campaignsClient.updateCampaign(initialData.id, payload);
          } else {
            await campaignsClient.createDraft(payload);
          }
          onSave();
        } catch (err) {
          console.error(err);
          alert("Erro ao salvar a campanha");
        } finally {
          setLoading(false);
        }
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao capturar o conteúdo do editor");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button isIconOnly variant="light" onPress={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold">{initialData ? 'Editar Campanha' : 'Nova Campanha'}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input 
          label="Nome da Campanha (Interno)" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          isRequired 
        />
        <Input 
          label="Assunto do E-mail" 
          value={subject} 
          onChange={(e) => setSubject(e.target.value)} 
          isRequired 
        />
        <Input 
          label="Nome do Remetente" 
          value={fromName} 
          onChange={(e) => setFromName(e.target.value)} 
          placeholder="Ex: CMSO 360" 
        />
        <Input 
          label="Responder Para (Reply-To)" 
          value={replyTo} 
          onChange={(e) => setReplyTo(e.target.value)} 
          placeholder="exemplo@cmso360.com.br" 
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Escopo de Envio</p>
        <RadioGroup value={scope} onValueChange={setScope} orientation="horizontal">
          <Radio value="all">Todas as Empresas</Radio>
          <Radio value="selected">Empresas Específicas</Radio>
        </RadioGroup>
      </div>

      {scope === 'selected' && (
        <div className="flex flex-col gap-4 border border-default-200 rounded-lg p-4 bg-default-50">
          <p className="text-sm font-semibold">Seleção de Empresas</p>
          
          {loadingCompanies ? (
             <div className="text-sm text-default-400">Carregando catálogo de empresas...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Coluna Esquerda: Pesquisa e Disponíveis */}
              <div className="flex flex-col gap-2">
                <Input 
                  size="sm" 
                  placeholder="Pesquisar por nome ou código..." 
                  value={searchCompany}
                  onChange={(e) => setSearchCompany(e.target.value)}
                />
                <div className="border border-default-200 rounded-md bg-white h-64 overflow-y-auto p-2 flex flex-col gap-1">
                  {filteredCompanies.length === 0 ? (
                    <span className="text-xs text-default-400 p-2">Nenhuma empresa encontrada.</span>
                  ) : (
                    filteredCompanies.slice(0, 100).map(c => (
                      <div 
                        key={c.CODIGO} 
                        onClick={() => toggleCompany(String(c.CODIGO))}
                        className="p-2 text-sm hover:bg-primary-50 hover:text-primary-700 cursor-pointer rounded-md transition-colors"
                      >
                        <span className="font-mono text-xs text-default-400 mr-2">{c.CODIGO}</span>
                        {c.RAZAOSOCIAL || c.NOMEFANTASIA}
                      </div>
                    ))
                  )}
                  {filteredCompanies.length > 100 && (
                    <span className="text-xs text-warning-600 p-2 text-center border-t border-default-100 mt-2">
                      Mais de 100 resultados. Use a pesquisa para refinar.
                    </span>
                  )}
                </div>
              </div>

              {/* Coluna Direita: Selecionadas */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-sm font-medium">Selecionadas ({selectedCompanies.length})</span>
                  {selectedCompanies.length > 0 && (
                    <span 
                      className="text-xs text-danger cursor-pointer hover:underline"
                      onClick={() => setSelectedCompanies([])}
                    >
                      Limpar Todas
                    </span>
                  )}
                </div>
                <div className="border border-default-200 rounded-md bg-white h-64 overflow-y-auto p-2 flex flex-col gap-1">
                  {selectedCompanyObjects.length === 0 ? (
                    <span className="text-xs text-default-400 p-2">Nenhuma selecionada.</span>
                  ) : (
                    selectedCompanyObjects.map(c => (
                      <div 
                        key={c.CODIGO} 
                        onClick={() => toggleCompany(String(c.CODIGO))}
                        className="p-2 text-sm bg-primary-50 text-primary-900 cursor-pointer rounded-md flex justify-between group"
                        title="Clique para remover"
                      >
                        <span className="truncate">
                          <span className="font-mono text-xs text-primary-400 mr-2">{c.CODIGO}</span>
                          {c.RAZAOSOCIAL || c.NOMEFANTASIA}
                        </span>
                        <span className="text-danger opacity-0 group-hover:opacity-100 transition-opacity">✕</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Corpo do E-mail</p>
        <EmailBuilder 
          ref={emailBuilderRef} 
          initialDesign={initialData?.editor_source} 
        />
        <p className="text-xs text-default-500">
          Você pode usar variáveis mágicas como <code className="bg-default-200 px-1 rounded">{`{{NOME_EMPRESA}}`}</code> dentro dos blocos de texto.
        </p>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="flat" onPress={onBack}>Cancelar</Button>
        <Button color="primary" startContent={!loading ? <Save className="w-4 h-4"/> : undefined} onPress={handleSave} isLoading={loading}>
          Salvar Rascunho
        </Button>
      </div>
    </div>
  );
}
