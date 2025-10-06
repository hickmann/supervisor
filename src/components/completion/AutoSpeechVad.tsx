import { UseCompletionReturn } from "@/types";
import { LoaderCircleIcon, MicIcon, MicOffIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { useWhisperStreamTherapist, WhisperSegmentEvent } from "@/hooks";
import { useSystemAudio } from "@/hooks/useSystemAudio";

interface AutoSpeechVADProps {
  setEnableVAD: UseCompletionReturn["setEnableVAD"];
}

export const AutoSpeechVAD = ({
  setEnableVAD,
}: AutoSpeechVADProps) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const systemAudio = useSystemAudio();

  // Callback para processar segmentos finais
  const handleFinalSegment = useCallback(
    async (segment: WhisperSegmentEvent) => {
      console.log("🎯 THERAPIST STREAM: Final segment received:", segment.text);
      
      try {
        setIsTranscribing(true);
        
        if (systemAudio && systemAudio.processMicrophoneTranscription) {
          console.log("🎯 THERAPIST STREAM: Sending to psychological supervision system");
          await systemAudio.processMicrophoneTranscription(segment.text);
          setEnableVAD(true);
        } else {
          console.error("❌ THERAPIST STREAM: Sistema de supervisão não disponível!");
        }
      } catch (error) {
        console.error("❌ THERAPIST STREAM: Failed to process final segment:", error);
      } finally {
        setIsTranscribing(false);
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
      if (isActive) {
        console.log("🛑 AutoSpeechVAD: Stopping whisper stream...");
        await stopStream();
      } else {
        console.log("🚀 AutoSpeechVAD: Starting whisper stream...");
        await startStream();
      }
    } catch (error) {
      console.error("❌ AutoSpeechVAD: Failed to toggle stream:", error);
    }
  };

  return (
    <>
      <Button
        size="icon"
        onClick={handleToggleVAD}
        className="cursor-pointer"
      >
        {isTranscribing ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />
        ) : isActive && liveText ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin" />
        ) : isActive ? (
          <MicOffIcon className="h-4 w-4 animate-pulse" />
        ) : (
          <MicIcon className="h-4 w-4" />
        )}
      </Button>
      {streamError && (
        <div className="text-xs text-red-400 mt-1">
          Erro: {streamError}
        </div>
      )}
    </>
  );
};