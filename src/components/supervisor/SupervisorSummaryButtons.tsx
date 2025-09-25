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
          const parseGeminiResponse = (response: string): Array<{title: string, subtitle: string, content: string}> => {
            if (!response) return [];
            
            const items: Array<{title: string, subtitle: string, content: string}> = [];
            
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
                  // Extrair subtítulo do primeiro item numerado, removendo **
                  const firstNumberedMatch = content.match(/^\s*\d+\.\s*\*\*([^*]+)\*\*/m);
                  const subtitle = firstNumberedMatch ? firstNumberedMatch[1].trim() : 
                    (content.match(/^\s*\d+\.\s*([^\n]+)/m) ? content.match(/^\s*\d+\.\s*([^\n]+)/m)![1].trim() : content.substring(0, 50) + '...');
                  
                  items.push({ title, subtitle, content });
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
                  // Extrair subtítulo do primeiro item numerado, removendo **
                  const firstNumberedMatch = content.match(/^\s*\d+\.\s*\*\*([^*]+)\*\*/m);
                  const subtitle = firstNumberedMatch ? firstNumberedMatch[1].trim() : 
                    (content.match(/^\s*\d+\.\s*([^\n]+)/m) ? content.match(/^\s*\d+\.\s*([^\n]+)/m)![1].trim() : content.substring(0, 50) + '...');
                  
                  items.push({ title, subtitle, content });
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
                  // Extrair subtítulo do primeiro item numerado, removendo **
                  const firstNumberedMatch = content.match(/^\s*\d+\.\s*\*\*([^*]+)\*\*/m);
                  const subtitle = firstNumberedMatch ? firstNumberedMatch[1].trim() : 
                    (content.match(/^\s*\d+\.\s*([^\n]+)/m) ? content.match(/^\s*\d+\.\s*([^\n]+)/m)![1].trim() : content.substring(0, 50) + '...');
                  
                  items.push({ title, subtitle, content });
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
                
                // Extrair subtítulo do primeiro item numerado
                const firstNumberedMatch = content.match(/^\s*\d+\.\s*([^\n]+)/m);
                const subtitle = firstNumberedMatch ? firstNumberedMatch[1].trim() : content.substring(0, 50) + '...';
                
                items.push({ title, subtitle, content });
              }
            }
            
            return items;
          };

  // Função para verificar se a resposta é genérica (sem recomendações específicas)
  const isGenericResponse = (response: string): boolean => {
    if (!response) return false;
    
    // Verificar se é a resposta especial do status 204
    if (response === "NO_CONTENT_204") {
      return true;
    }
    
    const genericPatterns = [
      /nenhuma recomendação específica/i,
      /não foi identificada/i,
      /não há recomendações/i,
      /não foram identificadas/i,
      /sem recomendações específicas/i,
      /não foram encontradas/i,
      /não há orientações específicas/i,
      /não foram detectadas/i,
      /sem orientações específicas/i,
      /não foram observadas/i,
      /sem sugestões específicas/i,
      /não foram identificados pontos/i,
      /não há pontos específicos/i,
      /sem pontos específicos/i,
      /não foram detectados pontos/i,
      /não há nada específico/i,
      /sem observações específicas/i,
      /não foram observados aspectos/i,
      /sem aspectos específicos/i,
      /não há aspectos específicos/i
    ];
    
    return genericPatterns.some(pattern => pattern.test(response));
  };

  // Auto-adicionar resposta do Gemini quando disponível
  useEffect(() => {
    if (lastAIResponse && !isAIProcessing && !isGenericResponse(lastAIResponse)) {
      const parsedItems = parseGeminiResponse(lastAIResponse);
      
              const newItems = parsedItems.map((item, index) => ({
                id: `${Date.now()}-${index}`,
                title: item.title,
                subtitle: item.subtitle,
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
                      className={`w-full h-auto justify-start text-left p-4 transition-all duration-200 rounded-lg ${
                        selectedItem?.id === item.id 
                          ? "bg-slate-700 hover:bg-slate-800 text-white shadow-md" 
                          : "bg-white/70 hover:bg-white/90 border-slate-200/50 hover:border-slate-300/50 text-slate-700 hover:text-slate-900"
                      }`}
                      onClick={() => handleItemSelect(item.id)}
                    >
                      <div className="flex flex-col items-start w-full">
                        <span className="text-sm font-semibold truncate w-full">
                          {item.title}
                        </span>
                        <span className={`text-xs truncate w-full mt-1 ${
                          selectedItem?.id === item.id ? "text-slate-200" : "text-slate-500"
                        }`}>
                          {item.subtitle}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
      ) : (
        /* Mostrar resposta atual quando não há botões salvos */
        lastAIResponse && (
          <div className="bg-white/70 backdrop-blur-sm border border-purple-200/30 rounded-xl p-4 shadow-sm">
            <div className="text-sm leading-relaxed text-slate-700 space-y-3">
              <div className="prose prose-slate prose-sm max-w-none">
                <Markdown>{lastAIResponse}</Markdown>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
