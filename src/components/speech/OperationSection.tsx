import { ChatConversation } from "@/types";
import { Button } from "../ui";
import {
  BotIcon,
  CopyIcon,
} from "lucide-react";
import { QuickActions } from "./QuickActions";
import { SupervisorSummaryButtons } from "../supervisor/SupervisorSummaryButtons";
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
  const { selectItem } = useSupervisor();
  
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
  
  // Verificar se há conteúdo para mostrar o header
  const hasContent = (lastAIResponse && !isGenericResponse(lastAIResponse)) || isAIProcessing || conversation.messages.length > 0;

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

      {/* Supervisão Psicológica - substitui a seção roxa pelos botões */}
      {(lastAIResponse && !isGenericResponse(lastAIResponse) || isAIProcessing) && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center">
              <BotIcon className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-purple-700">SUPERVISOR PSICOLÓGICO</h3>
                {isAIProcessing && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                    <span className="text-xs text-purple-600">Analisando...</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Análise e orientações sobre a intervenção terapêutica
              </p>
            </div>
          </div>

          {/* Botões sempre visíveis */}
          <SupervisorSummaryButtons 
            lastAIResponse={lastAIResponse}
            isAIProcessing={isAIProcessing}
          />
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
