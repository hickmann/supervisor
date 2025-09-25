import { Button } from "../ui";
import { useSupervisor } from "@/contexts";
import { BookOpenIcon, HelpCircleIcon, MessageCircleIcon, SparklesIcon } from "lucide-react";

export const AssistentClinicoSection = () => {
  const { assistentClinicoData, conversationBuffer, selectItem } = useSupervisor();
  
  // Verificações de segurança para evitar erros
  if (!assistentClinicoData || 
      !assistentClinicoData.conceito_definicao || 
      !assistentClinicoData.pergunta_e_resposta ||
      !assistentClinicoData.perguntas_exploratorias ||
      !assistentClinicoData.proximas_falas) {
    // Mostrar indicador de progresso se há falas no buffer
    if (conversationBuffer.length > 0) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">🤖 Assistente Clínico</h2>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">
                  Coletando conversas ({conversationBuffer.length}/5)
                </p>
                <p className="text-xs text-blue-600">
                  Aguardando mais {5 - conversationBuffer.length} falas para análise...
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">🤖 Assistente Clínico</h2>
      </div>

      {/* Tópico Principal */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-purple-900 mb-3">
          {assistentClinicoData.topico}
        </h3>
        
        {/* Resumo em bullets */}
        <div className="space-y-2">
          {assistentClinicoData.resumo.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-purple-600 text-sm font-bold mt-1">•</span>
              <p className="text-sm text-purple-800 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="grid grid-cols-2 gap-3">
        {/* Botão 1: Conceito/Definição */}
        {assistentClinicoData.conceito_definicao?.termo && (
          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-blue-50 border-blue-200"
            onClick={() => selectItem('conceito_definicao')}
          >
            <div className="flex items-center gap-2">
              <BookOpenIcon className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm text-blue-900">
                📖 {assistentClinicoData.conceito_definicao.termo}
              </span>
            </div>
            <p className="text-xs text-blue-700 text-left line-clamp-2">
              {assistentClinicoData.conceito_definicao.definicao?.substring(0, 80)}...
            </p>
          </Button>
        )}

        {/* Botão 2: Pergunta e Resposta */}
        {assistentClinicoData.pergunta_e_resposta?.pergunta && (
          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-green-50 border-green-200"
            onClick={() => selectItem('pergunta_resposta')}
          >
            <div className="flex items-center gap-2">
              <HelpCircleIcon className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm text-green-900">
                ❓ {assistentClinicoData.pergunta_e_resposta.pergunta.substring(0, 25)}...
              </span>
            </div>
            <p className="text-xs text-green-700 text-left line-clamp-2">
              {assistentClinicoData.pergunta_e_resposta.resposta_sugerida?.substring(0, 80)}...
            </p>
          </Button>
        )}

        {/* Botão 3: Perguntas Exploratórias */}
        {assistentClinicoData.perguntas_exploratorias && (
          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-orange-50 border-orange-200"
            onClick={() => selectItem('perguntas_exploratorias')}
          >
            <div className="flex items-center gap-2">
              <MessageCircleIcon className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-sm text-orange-900">
                💬 Perguntas exploratórias
              </span>
            </div>
            <p className="text-xs text-orange-700 text-left">
              {assistentClinicoData.perguntas_exploratorias.length} sugestões disponíveis
            </p>
          </Button>
        )}

        {/* Botão 4: Próximas Falas */}
        {assistentClinicoData.proximas_falas && (
          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-purple-50 border-purple-200"
            onClick={() => selectItem('proximas_falas')}
          >
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-sm text-purple-900">
                ✨ O que eu deveria falar depois?
              </span>
            </div>
            <p className="text-xs text-purple-700 text-left">
              {assistentClinicoData.proximas_falas.length} sugestões de intervenção
            </p>
          </Button>
        )}
      </div>
    </div>
  );
};
