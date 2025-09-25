import { useSupervisor } from "@/contexts";
import { Button } from "@/components";
import { Markdown } from "../Markdown";
import { useEffect } from "react";

interface SupervisorSummaryButtonsProps {
  lastAIResponse?: string;
  isAIProcessing?: boolean;
}

export const SupervisorSummaryButtons = ({ 
  lastAIResponse, 
  isAIProcessing 
}: SupervisorSummaryButtonsProps) => {
  const { items, selectedItem, selectItem, addItems } = useSupervisor();

  const handleItemSelect = (itemId: string) => {
    selectItem(itemId);
  };

  // Função para dividir a resposta do Gemini em múltiplos itens
  const parseGeminiResponse = (response: string): Array<{title: string, content: string}> => {
    if (!response) return [];
    
    const items: Array<{title: string, content: string}> = [];
    
    // Tentar encontrar títulos específicos comuns em supervisão psicológica
    const commonTitles = [
      "Aspectos Relacionais",
      "Questões Éticas", 
      "Avaliação Técnica",
      "Intervenções Sugeridas",
      "Observações Clínicas",
      "Recomendações",
      "Pontos de Atenção",
      "Estratégias Terapêuticas",
      "Dinâmica da Sessão",
      "Comportamentos Observados",
      "Padrões Identificados",
      "Orientação Clínica",
      "Reflexões sobre a Prática",
      "Aspectos Transferenciais",
      "Contratransferência",
      "Limitações Identificadas",
      "Pontos Fortes",
      "Áreas de Desenvolvimento"
    ];
    
    // Buscar por títulos específicos na resposta
    for (const title of commonTitles) {
      const regex = new RegExp(`(${title}[^]*?)(?=${commonTitles.filter(t => t !== title).join('|')}|$)`, 'gi');
      const match = response.match(regex);
      if (match) {
        const content = match[0].replace(new RegExp(`^${title}\\s*:?\\s*`, 'i'), '').trim();
        if (content.length > 10) {
          items.push({ title, content });
        }
      }
    }
    
    // Se não encontrou títulos específicos, tentar dividir por padrões
    if (items.length === 0) {
      // Tentar extrair títulos que terminam com dois pontos
      const colonPattern = /([^:\n]+):\s*([^]*?)(?=[^:\n]+:|$)/g;
      let match;
      while ((match = colonPattern.exec(response)) !== null) {
        const title = match[1].trim();
        const content = match[2].trim();
        if (title.length > 5 && title.length < 50 && content.length > 10) {
          items.push({ title, content });
        }
      }
    }
    
    // Se ainda não encontrou, tentar dividir por números ou marcadores
    if (items.length === 0) {
      const numberedPattern = /[\d\.\)\-\*\+]\s*([^:\n]+)[:\s]*([^]*?)(?=[\d\.\)\-\*\+]\s*[^:\n]+|$)/g;
      let match;
      while ((match = numberedPattern.exec(response)) !== null) {
        const title = match[1].trim();
        const content = match[2].trim();
        if (title.length > 5 && title.length < 50 && content.length > 10) {
          items.push({ title, content });
        }
      }
    }
    
    // Se ainda não encontrou nada, criar um item único
    if (items.length === 0) {
      const lines = response.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        const title = firstLine.length <= 50 ? firstLine : firstLine.substring(0, 47) + '...';
        const content = response;
        items.push({ title, content });
      }
    }
    
    return items;
  };

  // Auto-adicionar resposta do Gemini quando disponível
  useEffect(() => {
    if (lastAIResponse && !isAIProcessing) {
      const parsedItems = parseGeminiResponse(lastAIResponse);
      
      const newItems = parsedItems.map((item, index) => ({
        id: `${Date.now()}-${index}`,
        title: item.title,
        description: item.content,
        createdAt: new Date().toISOString(),
      }));

      if (newItems.length > 0) {
        addItems(newItems);
      }
    }
  }, [lastAIResponse, isAIProcessing, addItems]);

  return (
    <div className="space-y-3">
              {/* Lista de avaliações */}
              {items.length > 0 ? (
                <div className="space-y-2">
                  {items.slice(0, 5).map((item) => (
                    <Button
                      key={item.id}
                      variant={selectedItem?.id === item.id ? "default" : "secondary"}
                      className="w-full h-auto justify-start text-left p-3"
                      onClick={() => handleItemSelect(item.id)}
                    >
                      <div className="flex flex-col items-start w-full">
                        <span className="text-sm font-medium truncate w-full">
                          {item.title}
                        </span>
                        <span className="text-xs text-muted-foreground truncate w-full mt-1">
                          {item.title === "Aspectos Relacionais" && "Análise da dinâmica entre terapeuta e paciente"}
                          {item.title === "Questões Éticas" && "Considerações sobre limites e responsabilidades"}
                          {item.title === "Avaliação Técnica" && "Adequação das intervenções utilizadas"}
                          {item.title === "Intervenções Sugeridas" && "Recomendações para próximas sessões"}
                          {item.title === "Observações Clínicas" && "Comportamentos e padrões identificados"}
                          {item.title === "Recomendações" && "Orientações específicas para o caso"}
                          {item.title === "Pontos de Atenção" && "Aspectos que requerem cuidado especial"}
                          {item.title === "Estratégias Terapêuticas" && "Abordagens e técnicas recomendadas"}
                          {item.title === "Dinâmica da Sessão" && "Fluxo e interações durante a sessão"}
                          {item.title === "Comportamentos Observados" && "Ações e reações do paciente"}
                          {item.title === "Padrões Identificados" && "Tendências e repetições comportamentais"}
                          {item.title === "Orientação Clínica" && "Direcionamentos para a prática"}
                          {item.title === "Reflexões sobre a Prática" && "Análise do trabalho do terapeuta"}
                          {item.title === "Aspectos Transferenciais" && "Projeções e transferências identificadas"}
                          {item.title === "Contratransferência" && "Reações emocionais do terapeuta"}
                          {item.title === "Limitações Identificadas" && "Barreiras e dificuldades encontradas"}
                          {item.title === "Pontos Fortes" && "Aspectos positivos da intervenção"}
                          {item.title === "Áreas de Desenvolvimento" && "Oportunidades de melhoria"}
                          {!["Aspectos Relacionais", "Questões Éticas", "Avaliação Técnica", "Intervenções Sugeridas", "Observações Clínicas", "Recomendações", "Pontos de Atenção", "Estratégias Terapêuticas", "Dinâmica da Sessão", "Comportamentos Observados", "Padrões Identificados", "Orientação Clínica", "Reflexões sobre a Prática", "Aspectos Transferenciais", "Contratransferência", "Limitações Identificadas", "Pontos Fortes", "Áreas de Desenvolvimento"].includes(item.title) && "Análise e orientações sobre a intervenção"}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
      ) : (
        /* Mostrar resposta atual quando não há botões salvos */
        lastAIResponse && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 shadow-sm">
            <div className="text-sm leading-relaxed text-purple-900 space-y-2">
              <div className="prose prose-purple prose-sm max-w-none">
                <Markdown>{lastAIResponse}</Markdown>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
