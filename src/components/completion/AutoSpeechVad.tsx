import { fetchSTT } from "@/lib";
import { UseCompletionReturn } from "@/types";
import { useMicVAD } from "@ricky0123/vad-react";
import { LoaderCircleIcon, MicIcon, MicOffIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { useApp } from "@/contexts";
import { floatArrayToWav } from "@/lib/utils";
import { shouldUsePluelyAPI } from "@/lib/functions/pluely.api";
import { useSystemAudio } from "@/hooks/useSystemAudio";

interface AutoSpeechVADProps {
  submit: UseCompletionReturn["submit"];
  setState: UseCompletionReturn["setState"];
  setEnableVAD: UseCompletionReturn["setEnableVAD"];
}

export const AutoSpeechVAD = ({
  submit,
  setState,
  setEnableVAD,
}: AutoSpeechVADProps) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { selectedSttProvider, allSttProviders } = useApp();
  const systemAudio = useSystemAudio();

  const vad = useMicVAD({
    userSpeakingThreshold: 0.6,
    startOnLoad: true,
    onSpeechEnd: async (audio) => {
      try {
        // convert float32array to blob
        const audioBlob = floatArrayToWav(audio, 16000, "wav");

        let transcription: string;
        
        // SEMPRE USAR VOSK - NÃO PRECISA VERIFICAR PROVIDERS
        console.log("🎤 VAD: Using VOSK for all transcriptions");

        setIsTranscribing(true);

        console.log("🎤 VAD: Starting transcription with VOSK...");
        console.log("🎤 VAD: Audio blob size:", audioBlob.size);

        // SEMPRE USAR VOSK - FORÇAR USO
        transcription = await fetchSTT({
          provider: undefined,
          selectedProvider: { provider: "vosk-stt", variables: {} },
          audio: audioBlob,
        });

        if (transcription) {
          console.log("🎯 VAD: Microphone transcription (TERAPEUTA):", transcription);
          console.log("🎯 VAD: Transcription length:", transcription.length, "characters");
          
          // Sempre usar o sistema de supervisão quando disponível
          if (systemAudio && systemAudio.processMicrophoneTranscription) {
            console.log("🎯 VAD: Sending to psychological supervision system");
            await systemAudio.processMicrophoneTranscription(transcription);
          } else {
            // Fallback para o fluxo normal apenas se supervisão não estiver disponível
            console.log("🎯 VAD: Using normal completion flow (supervision not available)");
            submit(transcription);
          }
        }
      } catch (error) {
        console.error("Failed to transcribe audio:", error);
        setState((prev: any) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Transcription failed",
        }));
      } finally {
        setIsTranscribing(false);
      }
    },
  });

  return (
    <>
      <Button
        size="icon"
        onClick={() => {
          if (vad.listening) {
            vad.pause();
            setEnableVAD(false);
          } else {
            vad.start();
            setEnableVAD(true);
          }
        }}
        className="cursor-pointer"
      >
        {isTranscribing ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />
        ) : vad.userSpeaking ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin" />
        ) : vad.listening ? (
          <MicOffIcon className="h-4 w-4 animate-pulse" />
        ) : (
          <MicIcon className="h-4 w-4" />
        )}
      </Button>
    </>
  );
};
