import { ChatConversation } from "@/types";
import { Button } from "../ui";
import {
  CopyIcon,
} from "lucide-react";
import { QuickActions } from "./QuickActions";
import { AssistentClinicoSection } from "./AssistentClinicoSection";
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

      {/* Assistente Clínico */}
      <AssistentClinicoSection />

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
