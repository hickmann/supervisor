import { ChatConversation } from "@/types";
import { Markdown } from "../Markdown";
import { Button, Card } from "../ui";
import {
  BotIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HeadphonesIcon,
  MicIcon,
  UserIcon,
  GraduationCapIcon,
} from "lucide-react";
import { useState } from "react";
import { QuickActions } from "./QuickActions";

type Props = {
  lastTranscription: string;
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
  lastTranscription,
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
      {/* Últimas transcrições */}
      {(lastTerapeutaTranscription || lastPacienteTranscription) && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Última Atividade</h3>
          
          {lastTerapeutaTranscription && (
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <GraduationCapIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-blue-700">TERAPEUTA</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <Card className="p-3 bg-blue-50 border-blue-200">
                  <p className="text-sm text-blue-900">{lastTerapeutaTranscription}</p>
                </Card>
              </div>
            </div>
          )}

          {lastPacienteTranscription && (
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-green-700">PACIENTE</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <Card className="p-3 bg-green-50 border-green-200">
                  <p className="text-sm text-green-900">{lastPacienteTranscription}</p>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* Supervisão Psicológica */}
      {(lastAIResponse || isAIProcessing) && (
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
          <Card className="p-4 bg-purple-50 border-purple-200">
            {isAIProcessing && !lastAIResponse ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                <p className="text-sm italic text-purple-700">Analisando intervenção terapêutica...</p>
              </div>
            ) : (
              <div className="text-sm leading-relaxed text-purple-900">
                {lastAIResponse ? (
                  <Markdown>{lastAIResponse}</Markdown>
                ) : null}
                {isAIProcessing && (
                  <span className="inline-block w-2 h-4 bg-purple-600 animate-pulse ml-1" />
                )}
              </div>
            )}
          </Card>
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
