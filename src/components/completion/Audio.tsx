import { InfoIcon, PlayIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, Button, LoginModal } from "@/components";
import { VadOnly } from "./VadOnly";
import { UseCompletionReturn } from "@/types";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts";

export const Audio = ({
  micOpen,
  setMicOpen,
  setEnableVAD,
  systemAudio,
}: UseCompletionReturn & { systemAudio?: any }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Remover este useEffect - a captura do sistema será iniciada diretamente no handlePlayButtonClick

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

  const handlePlayButtonClick = async () => {
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

    // Usuário autenticado, iniciar sistema completo
    console.log("✅ User authenticated, starting complete system");
    
    // 1. Ativar VAD
    setEnableVAD(true);
    
    // 2. Abrir popover
    setMicOpen(true);
    
    // 3. Aguardar um pouco para garantir que o popover abra
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 4. Iniciar whisper_stream para terapeuta (sem system audio capture automático)
    console.log("🎤 Audio: Starting whisper_stream for therapist transcription");
    window.dispatchEvent(new CustomEvent("startWhisperStream"));
  };

  const handleLoginSuccess = async () => {
    console.log("✅ Login successful, starting complete system");
    setShowLoginModal(false);
    
    // Iniciar sistema completo após login
    setEnableVAD(true);
    setMicOpen(true);
    
    // Aguardar um pouco para garantir que o popover abra
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Iniciar whisper_stream para terapeuta (sem system audio capture automático)
    console.log("🎤 Audio: Starting whisper_stream for therapist transcription");
    window.dispatchEvent(new CustomEvent("startWhisperStream"));
  };

  return (
    <>
    <Popover open={micOpen} onOpenChange={setMicOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          onClick={handlePlayButtonClick}
          className="cursor-pointer"
          title="Iniciar sistema de supervisão"
        >
          <PlayIcon className="h-4 w-4" />
        </Button>
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
            
            {/* VadOnly para controle do whisper_stream */}
            <div className="mt-4 flex justify-center">
              <VadOnly
                setEnableVAD={setEnableVAD}
                systemAudio={systemAudio}
              />
            </div>
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
