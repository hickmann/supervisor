import { UseCompletionReturn } from "@/types";
import { LoaderCircleIcon, MicIcon, MicOffIcon } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "../ui/button";
import { useWhisperStreamTherapist, WhisperSegmentEvent } from "@/hooks";

interface VadOnlyProps {
  setEnableVAD: UseCompletionReturn["setEnableVAD"];
  systemAudio?: any;
}

export const VadOnly = ({
  setEnableVAD,
  systemAudio,
}: VadOnlyProps) => {
  const renderCount = useRef(0);
  renderCount.current++;
  console.log("🎤 VadOnly: Component rendered! (count:", renderCount.current, ")");

  // Usar ref para evitar recreação do callback
  const systemAudioRef = useRef(systemAudio);
  useEffect(() => {
    systemAudioRef.current = systemAudio;
  }, [systemAudio]);

  // Callback para processar segmentos finais - ESTÁVEL
  const handleFinalSegment = useCallback(
    async (segment: WhisperSegmentEvent) => {
      console.log("🎯 THERAPIST STREAM: Final segment received:", segment.text);
      
      try {
        const audio = systemAudioRef.current;
        if (audio && audio.processMicrophoneTranscription) {
          console.log("🎯 THERAPIST STREAM: Sending to psychological supervision system");
          await audio.processMicrophoneTranscription(segment.text);
        } else {
          console.error("❌ THERAPIST STREAM: Sistema de supervisão não disponível!");
        }
      } catch (error) {
        console.error("❌ THERAPIST STREAM: Failed to process final segment:", error);
      }
    },
    [] // SEM dependências - callback estável
  );

  const { isActive, liveText, startStream, stopStream, error: streamError } = useWhisperStreamTherapist(handleFinalSegment);

  // Sincronizar estado interno com o hook - APENAS UMA VEZ quando isActive muda
  const lastIsActive = useRef(isActive);
  useEffect(() => {
    if (lastIsActive.current !== isActive) {
      console.log("🎤 VadOnly: isActive changed from", lastIsActive.current, "to", isActive);
      lastIsActive.current = isActive;
      setEnableVAD(isActive);
    }
  }, [isActive, setEnableVAD]);

  const handleToggleVAD = async () => {
    try {
      console.log("🎤 VadOnly: Button clicked! Current state - isActive:", isActive);
      console.log("🎤 VadOnly: systemAudio available:", !!systemAudio);
      console.log("🎤 VadOnly: startStream function:", typeof startStream);
      console.log("🎤 VadOnly: stopStream function:", typeof stopStream);
      
      if (isActive) {
        console.log("🛑 VadOnly: Stopping whisper stream...");
        await stopStream();
        // Disparar evento para parar captura do sistema
        window.dispatchEvent(new CustomEvent("stopSystemAudioCapture"));
      } else {
        console.log("🚀 VadOnly: Starting whisper stream...");
        
        // ATIVAR IMEDIATAMENTE o sistema de supervisão ANTES de iniciar o stream
        console.log("🎤 VadOnly: Activating VAD system immediately");
        setEnableVAD(true);
        
        // Disparar evento para iniciar captura do sistema (abrir janelas de supervisão)
        console.log("🎤 VadOnly: Dispatching startSystemAudioCapture event");
        window.dispatchEvent(new CustomEvent("startSystemAudioCapture"));
        
        console.log("🚀 VadOnly: About to call startStream()");
        await startStream();
        console.log("🚀 VadOnly: startStream() completed");
      }
    } catch (error) {
      console.error("❌ VadOnly: Failed to toggle stream:", error);
      console.error("❌ VadOnly: Error details:", error);
    }
  };

  const getButtonIcon = () => {
    if (isActive && liveText) {
      return <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />;
    }
    if (isActive) {
      return <MicOffIcon className="h-4 w-4 animate-pulse text-red-500" />;
    }
    return <MicIcon className="h-4 w-4" />;
  };

  const getButtonTitle = () => {
    if (isActive && liveText) {
      return "Transcrevendo...";
    }
    if (isActive) {
      return "Parar whisper_stream";
    }
    return "Iniciar whisper_stream";
  };

  return (
    <>
      <Button
        size="icon"
        onClick={handleToggleVAD}
        className="cursor-pointer"
        title={getButtonTitle()}
      >
        {getButtonIcon()}
      </Button>
      {streamError && (
        <div className="text-xs text-red-400 mt-1">
          Erro: {streamError}
        </div>
      )}
    </>
  );
};