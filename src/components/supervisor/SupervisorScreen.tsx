import { motion, AnimatePresence } from "framer-motion";
import { useSupervisor } from "@/contexts";
import { Button } from "@/components";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

interface SupervisorScreenProps {
  children: React.ReactNode;
}

export const SupervisorScreen = ({ children }: SupervisorScreenProps) => {
  const { selectedItem, selectItem } = useSupervisor();

  const handleBack = () => {
    selectItem(null);
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

        {/* Página 1: Conteúdo da avaliação */}
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
                <div className="flex items-center gap-3 p-4 border-b">
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

                {/* Conteúdo */}
                <div className="flex-1 overflow-y-auto p-6">
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
