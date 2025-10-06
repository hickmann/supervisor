import { UseCompletionReturn } from "@/types";
import { LoaderCircleIcon, MicIcon, MicOffIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
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
  console.log("🎤 VadOnly: Component rendered!");

  // Callback para processar segmentos finais
  const handleFinalSegment = useCallback(
    async (segment: WhisperSegmentEvent) => {
      console.log("🎯 THERAPIST STREAM: Final segment received:", segment.text);
      console.log("🎯 THERAPIST STREAM: systemAudio available:", !!systemAudio);
      console.log("🎯 THERAPIST STREAM: processMicrophoneTranscription available:", !!(systemAudio && systemAudio.processMicrophoneTranscription));
      
      try {
        if (systemAudio && systemAudio.processMicrophoneTranscription) {
          console.log("🎯 THERAPIST STREAM: Sending to psychological supervision system");
          await systemAudio.processMicrophoneTranscription(segment.text);
          setEnableVAD(true);
        } else {
          console.error("❌ THERAPIST STREAM: Sistema de supervisão não disponível!");
          console.error("❌ THERAPIST STREAM: systemAudio:", systemAudio);
        }
      } catch (error) {
        console.error("❌ THERAPIST STREAM: Failed to process final segment:", error);
      }
    },
    [systemAudio, setEnableVAD]
  );

  const { isActive, liveText, startStream, stopStream, error: streamError } = useWhisperStreamTherapist(handleFinalSegment);

  // Sincronizar estado interno com o hook
  useEffect(() => {
    setEnableVAD(isActive);
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
      } else {
        console.log("🚀 VadOnly: Starting whisper stream...");
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