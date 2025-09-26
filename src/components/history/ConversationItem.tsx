import {
  MessageSquare,
  Copy,
  Trash2,
  Check,
  Loader2,
  Calendar,
  Upload,
} from "lucide-react";
import { Button } from "@/components";
import { ChatConversation } from "@/types/completion";
import { UseHistoryType } from "@/hooks/useHistory";

interface ConversationItemProps extends UseHistoryType {
  conversation: ChatConversation;
  currentConversationId: string | null;
  onSelectConversation: (conversation: ChatConversation) => void;
}

export const ConversationItem = ({
  conversation,
  currentConversationId,
  selectedConversationId,
  handleViewConversation,
  onSelectConversation,
  handleDeleteConfirm,
  formatDate,
  setIsOpen,
}: ConversationItemProps) => {
  // Função para calcular a duração da conversa
  const getConversationDuration = () => {
    if (conversation.messages.length === 0) return "0 min";
    const sortedMessages = [...conversation.messages].sort((a, b) => a.timestamp - b.timestamp);
    const startTime = sortedMessages[0].timestamp;
    const endTime = sortedMessages[sortedMessages.length - 1].timestamp;
    const durationMs = endTime - startTime;
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    return durationMinutes > 0 ? `${durationMinutes} min` : "< 1 min";
  };

  // Função para formatar o título completo
  const getFullTitle = () => {
    const duration = getConversationDuration();
    return `${conversation.title} • ${duration}`;
  };

  // Função para copiar a conversa completa
  const handleCopyConversation = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Previne que o clique abra a conversa
    try {
      // Formatar a conversa completa para cópia
      const conversationText = conversation.messages
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(message => {
          const roleLabel = message.role === "user" || message.role === "paciente" ? "PACIENTE" : 
                           message.role === "assistant" || message.role === "terapeuta" ? "TERAPEUTA" : 
                           message.role === "system" ? "SISTEMA" : String(message.role).toUpperCase();
          const time = new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          return `${roleLabel} (${time}): ${message.content}`;
        })
        .join('\n\n');
      
      const fullText = `${conversation.title}\n\n${conversationText}`;
      
      await navigator.clipboard.writeText(fullText);
      console.log("Conversation copied to clipboard");
    } catch (error) {
      console.error("Failed to copy conversation:", error);
    }
  };
  const handleViewClick = () => {
    handleViewConversation(conversation);
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectConversation(conversation);
    setIsOpen(false);
  };


  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDeleteConfirm(conversation.id);
  };

  return (
    <div
      className={`group flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
        conversation.id === currentConversationId
          ? "bg-muted border-primary/20"
          : "border-transparent hover:border-input/50"
      }`}
      onClick={handleViewClick}
    >
      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />

      <div className="flex w-full flex-row items-start gap-2">
        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="text-sm font-medium truncate leading-5 line-clamp-1">
            {getFullTitle()}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatDate(conversation.updatedAt)}
            </span>
            <span className="text-xs text-muted-foreground">
              • {conversation.messages.length} messages
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedConversationId === conversation.id && (
            <div className="flex items-center gap-1 text-blue-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">Loading...</span>
            </div>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="cursor-pointer h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={handleSelectClick}
            title="Avaliar com Supervisor"
          >
            <Upload className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="cursor-pointer h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={handleCopyConversation}
            title="Copie toda a conversa"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="cursor-pointer h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={handleDeleteClick}
            title="Delete esse atendimento"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
