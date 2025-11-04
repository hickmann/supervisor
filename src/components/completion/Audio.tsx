import { InfoIcon, PlayIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, Button, LoginModal } from "@/components";
import { VadOnly } from "./VadOnly";
import { UseCompletionReturn } from "@/types";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts";

export const Audio = ({
  micOpen,
  setMicOpen,
  enableVAD,
  setEnableVAD,
  systemAudio,
}: UseCompletionReturn & { systemAudio?: any }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Escutar quando o microfone é ativado para iniciar automaticamente a captura do sistema
  useEffect(() => {
    if (enableVAD) {
      console.log("🎤 Audio: Microphone activated, starting system audio capture");
      // Disparar evento para iniciar captura do sistema
      window.dispatchEvent(new CustomEvent("startSystemAudioCapture"));
    }
  }, [enableVAD]);

  // Escutar evento de sucesso de login para iniciar o VAD
  useEffect(() => {
    const handleLoginSuccess = () => {
      console.log("🎤 Audio: Received loginSuccessStartVAD event");
      console.log("🎤 Audio: Starting VAD after successful login");
      setEnableVAD(true);
      setMicOpen(true);
    };

    window.addEventListener("loginSuccessStartVAD", handleLoginSuccess);
    
    return () => {
      window.removeEventListener("loginSuccessStartVAD", handleLoginSuccess);
    };
  }, [setEnableVAD, setMicOpen]);

  const handlePlayButtonClick = () => {
    console.log("🎤 Audio: Play button clicked, checking authentication...");
    console.log("🔐 Auth status:", { isAuthenticated, authLoading });

    // Verificar se o usuário está autenticado
    if (!isAuthenticated && !authLoading) {
      console.log("❌ User not authenticated, showing login modal");
      // Abrir popover e mostrar modal de login
      setMicOpen(true);
      setTimeout(() => {
        setShowLoginModal(true);
      }, 100);
      return;
    }

    // Usuário autenticado, iniciar gravação
    console.log("✅ User authenticated, enabling VAD");
    setEnableVAD(true);
    // Auto-open popover to show VAD is active
    setMicOpen(true);
  };

  const handleLoginSuccess = () => {
    console.log("✅ Login successful, starting VAD");
    setShowLoginModal(false);
    setEnableVAD(true);
    setMicOpen(true);
  };

  return (
    <>
    <Popover open={micOpen} onOpenChange={setMicOpen}>
      <PopoverTrigger asChild>
        {enableVAD ? (
          <VadOnly
            setEnableVAD={setEnableVAD}
            systemAudio={systemAudio}
          />
        ) : (
          <Button
            size="icon"
            onClick={handlePlayButtonClick}
            className="cursor-pointer"
            title="Iniciar transcrição com a IA"
            disabled={authLoading}
          >
            <PlayIcon className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        className="w-screen p-0"
        sideOffset={8}
      >
        <div className="text-sm select-none">
          <div className="font-semibold text-green-600 mb-1 p-3">
            Sistema de Supervisão Integrado
          </div>
          <div className="text-muted-foreground p-3">
            <div className="mt-2 flex flex-row gap-1 items-center text-green-600">
              <InfoIcon size={16} />
              <span>CoterapIA</span>
            </div>

            <p className="block mt-2">
              Sistema integrado: suas falas são identificadas como TERAPEUTA e 
              enviadas para o sistema de supervisão psicológica em tempo real.
              Use junto com o botão de áudio do sistema para captura completa.
            </p>
          </div>
        </div>
            {/* Modal de Login */}
    <LoginModal 
      open={showLoginModal} 
      onOpenChange={setShowLoginModal}
      onSuccess={handleLoginSuccess}
    />
      </PopoverContent>
    </Popover>
  </>
  );
};
