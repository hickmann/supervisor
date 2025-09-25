import { motion, AnimatePresence } from "framer-motion";
import { useSupervisor } from "@/contexts";
import { Button } from "@/components";
import { ArrowLeft, UserIcon, GraduationCapIcon, CopyIcon } from "lucide-react";
import { useEffect } from "react";
import { ChatConversation } from "@/types";

interface SupervisorScreenProps {
  children: React.ReactNode;
  conversation?: ChatConversation;
}

export const SupervisorScreen = ({ children, conversation }: SupervisorScreenProps) => {
  const { selectedItem, selectItem } = useSupervisor();

  const handleBack = () => {
    selectItem(null);
  };

  // Função para copiar o conteúdo da resposta da IA
  const handleCopyContent = async () => {
    if (!selectedItem) return;
    
    try {
      await navigator.clipboard.writeText(selectedItem.description);
      // Aqui você pode adicionar um toast de sucesso se quiser
    } catch (err) {
      console.error('Erro ao copiar conteúdo:', err);
    }
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
      default:
        return {
          icon: <UserIcon className="h-4 w-4 text-muted-foreground" />,
          bgColor: "bg-muted",
          borderColor: "border-input",
          label: "SISTEMA",
          labelColor: "text-muted-foreground"
        };
    }
  };

  // Atalho ESC para voltar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedItem) {
        handleBack();
      }
    };

    if (selectedItem) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedItem]);

  // Se não há children (OperationSection retornou null), não renderiza nada
  if (!children) {
    return null;
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Container principal com animação de deslizamento */}
      <motion.div
        className="flex w-[200%] h-full"
        animate={{
          x: selectedItem ? "-50%" : "0%",
        }}
        transition={{
          duration: 1.0,
          ease: [0.25, 0.1, 0.25, 1], // easing suave
        }}
      >
        {/* Página 0: Layout original da tela de supervisão */}
        <div className="w-1/2 h-full">
          {children}
        </div>

        {/* Página 1: Conteúdo da avaliação ou transcrições */}
        <div className="w-1/2 flex flex-col h-full">
          <AnimatePresence mode="wait">
            {selectedItem && (
              <motion.div
                key={selectedItem.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.5 }}
                className="h-full flex flex-col"
              >
                {/* Header */}
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="flex items-center gap-2"
                        title="Voltar (ESC)"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Pressione ESC para voltar
                      </span>
                    </div>
                  </div>
                  
                  {/* Novo header com título da IA e título do botão */}
                  <div className="flex items-center justify-between mt-3">
                    <h2 className="text-lg font-semibold text-foreground">
                      Resposta da IA
                    </h2>
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {selectedItem.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyContent}
                        className="flex items-center gap-1"
                        title="Copiar resposta da IA"
                      >
                        <CopyIcon className="h-4 w-4" />
                        Copiar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 overflow-y-auto p-6">
                  {selectedItem.id === 'transcriptions' ? (
                    /* Conteúdo das transcrições */
                    <div className="space-y-3 max-h-full">
                      <h3 className="text-lg font-semibold mb-4">Transcrições da Sessão</h3>
                      {conversation?.messages && conversation.messages.length > 0 ? (
                        <div className="space-y-3">
                          {conversation.messages
                            .sort((a, b) => a.timestamp - b.timestamp) // Ordem cronológica
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
                                    <div className={`p-3 rounded-lg border ${roleInfo.bgColor} ${roleInfo.borderColor}`}>
                                      <div className={`text-sm leading-relaxed ${message.role === 'terapeuta' ? 'text-blue-900' : 'text-green-900'}`}>
                                        {message.content}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          Nenhuma transcrição disponível
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Conteúdo da supervisão */
                    <div className="bg-muted/50 rounded-lg p-6 border max-h-full">
                      <div 
                        className="whitespace-pre-wrap leading-relaxed text-foreground overflow-y-auto max-h-full"
                        style={{ whiteSpace: 'pre-wrap' }}
                      >
                        {selectedItem.description
                          .replace(/\*\*/g, '') // Remove **
                          .replace(/\*/g, '') // Remove *
                          .replace(/#{1,6}\s*/g, '') // Remove headers markdown
                          .replace(/`/g, '') // Remove backticks
                          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links markdown, mantém texto
                          .replace(/^\s*[-*+]\s*/gm, '• ') // Converte listas markdown para bullet points
                          .replace(/^\s*\d+\.\s*/gm, '') // Remove numeração de listas
                          .trim()}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
