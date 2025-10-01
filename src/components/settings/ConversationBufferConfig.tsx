import { Input, Label, Header } from "@/components";
import { CONVERSATION_BUFFER_DEFAULTS } from "@/config";
import { UseSettingsReturn } from "@/types";

interface ConversationBufferConfigProps {
  conversationBufferConfig: UseSettingsReturn['conversationBufferConfig'];
  handleConversationBufferMessageCountChange: UseSettingsReturn['handleConversationBufferMessageCountChange'];
  handleConversationBufferMinTextLengthChange: UseSettingsReturn['handleConversationBufferMinTextLengthChange'];
  className?: string;
}

export const ConversationBufferConfig = ({ 
  conversationBufferConfig,
  handleConversationBufferMessageCountChange,
  handleConversationBufferMinTextLengthChange,
  className 
}: ConversationBufferConfigProps) => {

  const handleMessageCountChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      // Clamp value between min and max
      const clampedValue = Math.max(
        CONVERSATION_BUFFER_DEFAULTS.MIN_MESSAGE_COUNT,
        Math.min(CONVERSATION_BUFFER_DEFAULTS.MAX_MESSAGE_COUNT, numValue)
      );
      handleConversationBufferMessageCountChange(clampedValue);
    }
  };

  const handleMinTextLengthChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      handleConversationBufferMinTextLengthChange(numValue);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Header
        title="Configuração do Buffer de Conversa"
        description="Controla quantas mensagens são armazenadas antes de enviar para a IA"
        isMainTitle
      />
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="message-count" className="text-sm font-medium">
            Número de Mensagens
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              id="message-count"
              type="number"
              min={CONVERSATION_BUFFER_DEFAULTS.MIN_MESSAGE_COUNT}
              max={CONVERSATION_BUFFER_DEFAULTS.MAX_MESSAGE_COUNT}
              value={conversationBufferConfig.messageCount}
              onChange={(e) => handleMessageCountChange(e.target.value)}
              className="w-20"
              aria-label="Número de mensagens para buffer"
            />
            <span className="text-xs text-muted-foreground">
              ({CONVERSATION_BUFFER_DEFAULTS.MIN_MESSAGE_COUNT}-{CONVERSATION_BUFFER_DEFAULTS.MAX_MESSAGE_COUNT})
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Quantas mensagens devem ser coletadas antes de enviar para a IA
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="min-text-length" className="text-sm font-medium">
            Comprimento Mínimo do Texto
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              id="min-text-length"
              type="number"
              min="1"
              value={conversationBufferConfig.minTextLength}
              onChange={(e) => handleMinTextLengthChange(e.target.value)}
              className="w-20"
              aria-label="Comprimento mínimo do texto"
            />
            <span className="text-xs text-muted-foreground">caracteres</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Número mínimo de caracteres para considerar o texto suficiente
          </p>
        </div>
      </div>
    </div>
  );
};
