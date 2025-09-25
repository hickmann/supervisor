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

  // Função para extrair título da resposta do Gemini
  const extractTitleFromResponse = (response: string): string => {
    if (!response) return "Supervisão Psicológica";
    
    // Tentar extrair título da primeira linha ou frase
    const lines = response.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      
      // Se a primeira linha tem menos de 50 caracteres, usar como título
      if (firstLine.length <= 50 && firstLine.length > 10) {
        return firstLine;
      }
      
      // Se não, pegar as primeiras palavras
      const words = firstLine.split(' ');
      if (words.length > 0) {
        return words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
      }
    }
    
    // Fallback: primeiras palavras da resposta
    const words = response.split(' ').slice(0, 4);
    return words.join(' ') + (response.split(' ').length > 4 ? '...' : '');
  };

  // Auto-adicionar resposta do Gemini quando disponível
  useEffect(() => {
    if (lastAIResponse && !isAIProcessing) {
      const title = extractTitleFromResponse(lastAIResponse);
      
      const newItem = {
        id: Date.now().toString(),
        title: title,
        description: lastAIResponse,
        createdAt: new Date().toISOString(),
      };

      addItems([newItem]);
    }
  }, [lastAIResponse, isAIProcessing, addItems]);

  return (
    <div className="space-y-3">
      {/* Lista de avaliações */}
      {items.length > 0 ? (
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {items.slice(0, 6).map((item) => (
            <Button
              key={item.id}
              variant={selectedItem?.id === item.id ? "default" : "secondary"}
              className="w-full h-8 justify-start text-left text-xs"
              onClick={() => handleItemSelect(item.id)}
            >
              <span className="truncate">
                {item.title}
              </span>
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
