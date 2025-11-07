import {
  blobToBase64,
} from "./common.function";
import { invoke } from "@tauri-apps/api/core";

import { TYPE_PROVIDER } from "@/types";

// CoterapIA STT function
export async function fetchCoterapiaSTT(audio: File | Blob): Promise<string> {
  try {
    // Convert audio to base64
    const audioBase64 = await blobToBase64(audio);

    // Call Tauri command
    const response = await invoke<{
      success: boolean;
      transcription?: string;
      error?: string;
    }>("transcribe_audio", {
      audioBase64,
    });

    if (response.success && response.transcription) {
      return response.transcription;
    } else {
      return response.error || "Transcription failed";
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `CoterapIA STT Error: ${errorMessage}`;
  }
}

// Whisper STT function
export async function fetchWhisperSTT(audio: File | Blob): Promise<string> {
  console.log("🎤 WHISPER STT: Starting transcription...");
  console.log("📊 WHISPER STT: Audio size:", audio.size, "bytes");
  console.log("🤖 WHISPER STT: Using model: ggml-small.bin");
  
  try {
    // Convert audio to base64
    console.log("🔄 WHISPER STT: Converting audio to base64...");
    const audioBase64 = await blobToBase64(audio);
    console.log("✅ WHISPER STT: Audio converted to base64, length:", audioBase64.length);

    // Call Tauri Whisper command
    console.log("📡 WHISPER STT: Calling Tauri Whisper command...");
    const response = await invoke<{
      success: boolean;
      transcription?: string;
      error?: string;
      segments?: Array<{
        id: number;
        seek: number;
        start: number;
        end: number;
        text: string;
        tokens: number[];
        temperature: number;
        avg_logprob: number;
        compression_ratio: number;
        no_speech_prob: number;
      }>;
    }>("transcribe_audio_with_whisper", {
      audioBase64,
    });

    console.log("📥 WHISPER STT: Response received:", response);

    if (response.success && response.transcription) {
      console.log("✅ WHISPER STT: Transcription successful!");
      console.log("📝 WHISPER STT: TRANSCRIBED TEXT:", response.transcription);
      console.log("📝 WHISPER STT: Text length:", response.transcription.length, "characters");
      console.log("📝 WHISPER STT: Text preview:", response.transcription.substring(0, 100) + (response.transcription.length > 100 ? "..." : ""));
      
      if (response.segments && response.segments.length > 0) {
        console.log("📊 WHISPER STT: Segments received:", response.segments.length);
        response.segments.forEach((segment, index) => {
          console.log(`📊 WHISPER STT: Segment ${index}: ${segment.start}s-${segment.end}s: "${segment.text}"`);
        });
      }
      
      return response.transcription;
    } else {
      console.warn("⚠️ WHISPER STT: Transcription failed:", response.error);
      return response.error || "WHISPER transcription failed";
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ WHISPER STT: Error:", errorMessage);
    return `WHISPER STT Error: ${errorMessage}`;
  }
}

export interface STTParams {
  provider: TYPE_PROVIDER | undefined;
  selectedProvider: {
    provider: string;
    variables: Record<string, string>;
  };
  audio: File | Blob;
}

/**
 * Transcribes audio and returns either the transcription or an error/warning message as a single string.
 */
export async function fetchSTT(params: STTParams): Promise<string> {
  console.log("🚀 STT: fetchSTT called with params:", {
    providerId: params.provider?.id,
    selectedProvider: params.selectedProvider?.provider,
    audioSize: params.audio?.size
  });

  try {
    const { audio } = params;

    if (!audio) throw new Error("Audio file is required");

    // FORÇAR USO DO WHISPER - SEMPRE USAR WHISPER
    console.log("🎯 STT: FORCING WHISPER usage - no other providers allowed");
    return await fetchWhisperSTT(audio);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(msg);
  }
}
