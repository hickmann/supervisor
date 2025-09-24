import { ChatConversation } from "@/types";
import { Markdown } from "../Markdown";
import { Button, Card } from "../ui";
import {
  BotIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HeadphonesIcon,
  UserIcon,
  GraduationCapIcon,
} from "lucide-react";
import { useState } from "react";
import { QuickActions } from "./QuickActions";

type Props = {
  lastAIResponse: string;
  isAIProcessing: boolean;
  conversation: ChatConversation;
  startNewConversation: () => void;
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
  startNewConversation,
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
  const [openConversation, setOpenConversation] = useState(false);
  
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
  
  // Função para obter ícone e estilo baseado no role
  const getRoleInfo = (role: string) => {
    switch (role) {
      case "terapeuta":
        return {
          icon: <GraduationCapIcon className="h-4 w-4 text-blue-600" />,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          label: "TERAPEUTA",
          labelColor: "text-blue-700"
        };
      case "paciente":
        return {
          icon: <UserIcon className="h-4 w-4 text-green-600" />,
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          label: "PACIENTE",
          labelColor: "text-green-700"
        };
      case "assistant":
        return {
          icon: <BotIcon className="h-4 w-4 text-purple-600" />,
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          label: "SUPERVISOR",
          labelColor: "text-purple-700"
        };
      default:
        return {
          icon: <HeadphonesIcon className="h-4 w-4 text-muted-foreground" />,
          bgColor: "bg-muted",
          borderColor: "border-input",
          label: "SISTEMA",
          labelColor: "text-muted-foreground"
        };
    }
  };
  return (
    <div className="space-y-4">

      {/* Quick Actions - sempre visível quando há atividade */}
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

      {/* Supervisão Psicológica - só mostra se não for resposta genérica */}
      {(lastAIResponse && !isGenericResponse(lastAIResponse) || isAIProcessing) && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center">
              <BotIcon className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-purple-700">SUPERVISOR PSICOLÓGICO</h3>
              <p className="text-xs text-muted-foreground">
                Análise e orientações sobre a intervenção terapêutica
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 shadow-sm">
            {isAIProcessing && !lastAIResponse ? (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-600 animate-pulse" />
                <p className="text-sm font-medium text-purple-800">Analisando intervenção terapêutica...</p>
              </div>
            ) : (
              <div className="text-sm leading-relaxed text-purple-900 space-y-2">
                {lastAIResponse ? (
                  <div className="prose prose-purple prose-sm max-w-none">
                    <Markdown>{lastAIResponse}</Markdown>
                  </div>
                ) : null}
                {isAIProcessing && (
                  <span className="inline-block w-2 h-4 bg-purple-600 animate-pulse ml-1" />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {conversation.messages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3
              className="font-semibold text-md w-full cursor-pointer"
              onClick={() => setOpenConversation(!openConversation)}
            >
              Histórico da Sessão ({conversation.messages.length} mensagens)
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpenConversation(!openConversation)}
              >
                {openConversation ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  startNewConversation();
                  setOpenConversation(false);
                }}
              >
                Nova Sessão
              </Button>
            </div>
          </div>

          {openConversation && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {conversation.messages
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((message, index) => {
                  const roleInfo = getRoleInfo(message.role);
                  return (
                    <div key={`${message.id}-${index}`} className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-full ${roleInfo.bgColor} ${roleInfo.borderColor} border flex items-center justify-center flex-shrink-0`}>
                        {roleInfo.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${roleInfo.labelColor}`}>
                            {roleInfo.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <Card className={`p-3 ${roleInfo.bgColor} ${roleInfo.borderColor} border`}>
                          <div className={`text-sm leading-relaxed ${message.role === 'assistant' ? 'text-purple-900' : message.role === 'terapeuta' ? 'text-blue-900' : 'text-green-900'}`}>
                            <Markdown>{message.content}</Markdown>
                          </div>
                        </Card>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
