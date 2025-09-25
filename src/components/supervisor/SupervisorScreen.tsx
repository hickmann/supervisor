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
          duration: 0.8,
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
                <div className="pt-2 pb-4 px-4 border-b border-slate-200/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="flex items-center gap-2 bg-white/60 hover:bg-white/80 border-slate-200/50 text-slate-700 hover:text-slate-900 transition-all duration-200 rounded-lg"
                        title="Voltar (ESC)"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                      </Button>
                      <span className="text-sm text-slate-300">
                        Pressione ESC para voltar
                      </span>
                    </div>
                  </div>
                  
                  {/* Novo header com título da IA e título do botão */}
                  <div className="flex items-center justify-between mt-4">
                    <h2 className="text-xl font-semibold text-white tracking-tight">
                      Resposta da IA
                    </h2>
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-medium text-slate-200">
                        {selectedItem.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyContent}
                        className="flex items-center gap-2 bg-white/60 hover:bg-white/80 border-slate-200/50 text-slate-700 hover:text-slate-900 transition-all duration-200 rounded-lg"
                        title="Copiar resposta da IA"
                      >
                        <CopyIcon className="h-4 w-4" />
                        Copiar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 overflow-y-auto pt-3 pb-4 px-4">
                  {selectedItem.id === 'transcriptions' ? (
                    /* Conteúdo das transcrições */
                    <div className="space-y-3 max-h-full">
                      <h3 className="text-lg font-semibold text-white mb-4 tracking-tight">Transcrições da Sessão</h3>
                      {conversation?.messages && conversation.messages.length > 0 ? (
                        <div className="space-y-3">
                          {conversation.messages
                            .sort((a, b) => b.timestamp - a.timestamp) // Ordem reversa (mais recentes primeiro)
                            .map((message, index) => {
                              const roleInfo = getRoleInfo(message.role);
                              return (
                                <div key={`${message.id}-${index}`} className="flex items-start gap-4">
                                  <div className={`h-10 w-10 rounded-full ${roleInfo.bgColor} ${roleInfo.borderColor} border flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                    {roleInfo.icon}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className={`text-xs font-semibold ${roleInfo.labelColor}`}>
                                        {roleInfo.label}
                                      </span>
                                      <span className="text-xs text-slate-500">
                                        {new Date(message.timestamp).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    <div className={`p-4 rounded-xl border ${roleInfo.bgColor} ${roleInfo.borderColor} shadow-sm`}>
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
                        <div className="text-center text-slate-300 py-12">
                          Nenhuma transcrição disponível
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Conteúdo da supervisão */
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-slate-200/30 shadow-sm max-h-full">
                      <div 
                        className="whitespace-pre-wrap leading-relaxed text-slate-700 overflow-y-auto max-h-full text-sm"
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
