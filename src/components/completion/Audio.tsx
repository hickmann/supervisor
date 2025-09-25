import { InfoIcon, PlayIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, Button } from "@/components";
import { VadOnly } from "./VadOnly";
import { UseCompletionReturn } from "@/types";
import { useEffect } from "react";

export const Audio = ({
  micOpen,
  setMicOpen,
  enableVAD,
  setEnableVAD,
  systemAudio,
}: UseCompletionReturn & { systemAudio?: any }) => {
  // Escutar quando o microfone é ativado para iniciar automaticamente a captura do sistema
  useEffect(() => {
    if (enableVAD) {
      console.log("🎤 Audio: Microphone activated, starting system audio capture");
      // Disparar evento para iniciar captura do sistema
      window.dispatchEvent(new CustomEvent("startSystemAudioCapture"));
    }
  }, [enableVAD]);

  return (
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
            onClick={() => {
              console.log("🎤 Audio: Enabling VAD from main button");
              setEnableVAD(true);
              // Auto-open popover to show VAD is active
              setMicOpen(true);
            }}
            className="cursor-pointer"
            title="Iniciar transcrição com a IA"
          >
            <PlayIcon className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        className="w-80 p-3"
        sideOffset={8}
      >
        <div className="text-sm select-none">
          <div className="font-semibold text-green-600 mb-1">
            Sistema de Supervisão Integrado
          </div>
          <div className="text-muted-foreground">
            <div className="mt-2 flex flex-row gap-1 items-center text-green-600">
              <InfoIcon size={16} />
              <span>MICROFONE → SUPERVISÃO PSICOLÓGICA</span>
            </div>

            <p className="block mt-2">
              Sistema integrado: suas falas são identificadas como TERAPEUTA e 
              enviadas para o sistema de supervisão psicológica em tempo real.
              Use junto com o botão de áudio do sistema para captura completa.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
