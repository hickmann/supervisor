import { ChatConversation } from "@/types";
import { Button } from "../ui";
import {
  CopyIcon,
} from "lucide-react";
import { QuickActions } from "./QuickActions";
import { useSupervisor } from "@/contexts";

type Props = {
  lastAIResponse: string;
  isAIProcessing: boolean;
  conversation: ChatConversation;
  quickActions: string[];
  addQuickAction: (action: string) => void;
  removeQuickAction: (action: string) => void;
  isManagingQuickActions: boolean;
  setIsManagingQuickActions: (isManaging: boolean) => void;
  showQuickActions: boolean;
  setShowQuickActions: (show: boolean) => void;
  handleQuickActionClick: (action: string) => void;
  // Novos props para supervisão psicológica
  lastTerapeutaTranscription?: string;
  lastPacienteTranscription?: string;
};

export const OperationSection = ({
  lastAIResponse,
  isAIProcessing,
  conversation,
  quickActions,
  addQuickAction,
  removeQuickAction,
  isManagingQuickActions,
  setIsManagingQuickActions,
  showQuickActions,
  setShowQuickActions,
  handleQuickActionClick,
  lastTerapeutaTranscription,
  lastPacienteTranscription,
}: Props) => {
  const { selectItem, assistentClinicoData, conversationBuffer } = useSupervisor();
  
  // Função para copiar toda a transcrição
  const copyTranscription = async () => {
    const allMessages = conversation.messages
      .sort((a, b) => a.timestamp - b.timestamp) // Ordem cronológica
      .map(msg => {
        const role = msg.role === 'terapeuta' ? 'TERAPEUTA' : 
                    msg.role === 'paciente' ? 'PACIENTE' : 'SISTEMA';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');
    
    try {
      await navigator.clipboard.writeText(allMessages);
      // Aqui você pode adicionar um toast de sucesso se quiser
    } catch (err) {
      console.error('Erro ao copiar transcrição:', err);
    }
  };

  // Função para mostrar transcrições (abre como os botões de supervisão)
  const showTranscriptions = () => {
    // Usar o sistema de seleção do supervisor para mostrar as transcrições
    selectItem('transcriptions');
  };
  
  // Função para verificar se a resposta é genérica
  const isGenericResponse = (response: string): boolean => {
    if (!response) return false;
    
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
      /não foram detectados pontos/i
    ];
    
    return genericPatterns.some(pattern => pattern.test(response));
  };
  
  // Verificar se há conteúdo para mostrar - agora incluindo assistente clínico
  const hasContent = (lastAIResponse && !isGenericResponse(lastAIResponse)) || 
                     isAIProcessing || 
                     conversation.messages.length > 0 || 
                     assistentClinicoData || 
                     conversationBuffer.length > 0;

  // Se não há conteúdo, não renderiza nada
  if (!hasContent) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header com Percepções e botões */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">✨ Percepções</h2>
        <div className="flex items-center gap-2">
          {conversation.messages.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={showTranscriptions}
                className="flex items-center gap-2"
              >
                Mostrar transcrição
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyTranscription}
                className="flex items-center gap-2"
                title="Copiar transcrição completa"
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Seção do Assistente Clínico - abaixo de Percepções */}
      {assistentClinicoData && (
        <div className="space-y-4">
          {/* Tópico Principal */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-bold text-purple-900 mb-3">
              {assistentClinicoData.topico}
            </h3>
            
            {/* Resumo em bullets */}
            {assistentClinicoData.resumo && assistentClinicoData.resumo.length > 0 && (
              <div className="space-y-2">
                {assistentClinicoData.resumo.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-purple-600 text-sm font-bold mt-1">•</span>
                    <p className="text-sm text-purple-800 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3">
            {/* Botão 1: Conceito/Definição */}
            {assistentClinicoData.conceito_definicao?.termo && (
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-blue-50 border-blue-200"
                onClick={() => selectItem('conceito_definicao')}
              >
                <div className="flex items-center gap-2">
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
                  <span className="font-medium text-sm text-purple-900">
                    ✨ O que eu deveria falar depois?
                  </span>
                </div>
                <p className="text-xs text-purple-700 text-left">
                  {assistentClinicoData.proximas_falas.length} sugestões de intervenção
                </p>
              </Button>
            )}

            {/* Botão 5: Checagem de Fatos */}
            {assistentClinicoData.checagem_fatos && assistentClinicoData.checagem_fatos.length > 0 && (
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-yellow-50 border-yellow-200"
                onClick={() => selectItem('checagem_fatos')}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-yellow-900">
                    ✔️ {assistentClinicoData.checagem_fatos[0].afirmacao.substring(0, 30)}...
                  </span>
                </div>
                <p className="text-xs text-yellow-700 text-left">
                  Verificação de fatos disponível
                </p>
              </Button>
            )}
          </div>
        </div>
      )}


      {/* Quick Actions - movido para o final */}
      {(lastTerapeutaTranscription || lastPacienteTranscription || lastAIResponse || isAIProcessing) && (
        <QuickActions
          actions={quickActions}
          onActionClick={handleQuickActionClick}
          onAddAction={addQuickAction}
          onRemoveAction={removeQuickAction}
          isManaging={isManagingQuickActions}
          setIsManaging={setIsManagingQuickActions}
          show={showQuickActions}
          setShow={setShowQuickActions}
        />
      )}
    </div>
  );
};
