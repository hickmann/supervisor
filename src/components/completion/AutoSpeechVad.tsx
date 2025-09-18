import { UseCompletionReturn } from "@/types";
import { useMicVAD } from "@ricky0123/vad-react";
import { LoaderCircleIcon, MicIcon, MicOffIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { floatArrayToWav } from "@/lib/utils";
import { voskLocal } from "@/lib/vosk-local";

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
  const [voskReady, setVoskReady] = useState(false);

  // Initialize Vosk on component mount
  useEffect(() => {
    const initializeVosk = async () => {
      try {
        await voskLocal.initialize();
        setVoskReady(true);
        console.log("Vosk local ready for transcription");
      } catch (error) {
        console.error("Failed to initialize Vosk:", error);
        setState((prev: any) => ({
          ...prev,
          error: "Failed to initialize local speech recognition.",
        }));
      }
    };

    initializeVosk();
  }, [setState]);

  const vad = useMicVAD({
    userSpeakingThreshold: 0.6,
    startOnLoad: true,
    onSpeechEnd: async (audio) => {
      if (!voskReady) {
        console.warn("Vosk not ready yet");
        setState((prev: any) => ({
          ...prev,
          error: "Speech recognition not ready. Please wait...",
        }));
        return;
      }

      try {
        setIsTranscribing(true);
        setState((prev: any) => ({ ...prev, error: "" }));

        // Convert float32array to WAV blob
        const audioBlob = floatArrayToWav(audio, 16000, "wav");

        // Transcribe using Vosk local
        const transcription = await voskLocal.transcribe(audioBlob);

        if (transcription && transcription.trim()) {
          console.log("Vosk transcription:", transcription);
          submit(transcription);
        } else {
          console.warn("Empty transcription result");
          setState((prev: any) => ({
            ...prev,
            error: "No speech detected. Please try speaking more clearly.",
          }));
        }
      } catch (error) {
        console.error("Failed to transcribe audio:", error);
        setState((prev: any) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Transcription failed",
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
          if (!voskReady) {
            console.warn("Vosk not ready yet");
            return;
          }
          
          if (vad.listening) {
            vad.pause();
            setEnableVAD(false);
          } else {
            vad.start();
            setEnableVAD(true);
          }
        }}
        className="cursor-pointer"
        disabled={!voskReady}
        title={!voskReady ? "Initializing speech recognition..." : 
               vad.listening ? "Stop listening" : "Start listening"}
      >
        {!voskReady ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin text-blue-500" />
        ) : isTranscribing ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />
        ) : vad.userSpeaking ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin text-orange-500" />
        ) : vad.listening ? (
          <MicOffIcon className="h-4 w-4 animate-pulse text-red-500" />
        ) : (
          <MicIcon className="h-4 w-4" />
        )}
      </Button>
    </>
  );
};
