/**
 * Whisper HTTP STT Function
 * 
 * Substitui a função fetchWhisperSTT para usar HTTP em vez de Tauri
 * Mantém a mesma interface para compatibilidade com o código existente
 */

import { transcribeAudioWithHttp } from '../whisper-http-client';

/**
 * Transcreve áudio usando Whisper via HTTP
 * Mantém a mesma interface que fetchWhisperSTT para compatibilidade
 */
export async function fetchWhisperHttpSTT(audio: File | Blob): Promise<string> {
  console.log("🎤 WHISPER HTTP STT: Starting transcription via HTTP...");
  console.log("📊 WHISPER HTTP STT: Audio size:", audio.size, "bytes");
  console.log("🔌 WHISPER HTTP STT: Using HTTP connection to whisper_server");
  
  try {
    console.log("🔄 WHISPER HTTP STT: Sending audio to whisper_server...");
    
    const transcription = await transcribeAudioWithHttp(audio);
    
    if (transcription && transcription.trim()) {
      console.log("✅ WHISPER HTTP STT: Transcription successful!");
      console.log("📝 WHISPER HTTP STT: TRANSCRIBED TEXT:", transcription);
      console.log("📝 WHISPER HTTP STT: Text length:", transcription.length, "characters");
      console.log("📝 WHISPER HTTP STT: Text preview:", transcription.substring(0, 100) + (transcription.length > 100 ? "..." : ""));
      
      return transcription;
    } else {
      console.warn("⚠️ WHISPER HTTP STT: Empty transcription received");
      return "Transcrição vazia - nenhum texto detectado";
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ WHISPER HTTP STT: Error:", errorMessage);
    return `WHISPER HTTP STT Error: ${errorMessage}`;
  }
}

/**
 * Função wrapper que decide entre HTTP ou Tauri baseado na configuração
 * Por padrão usa HTTP, mas pode fallback para Tauri se necessário
 */
export async function fetchWhisperSTT(audio: File | Blob, useHttp: boolean = true): Promise<string> {
  if (useHttp) {
    try {
      return await fetchWhisperHttpSTT(audio);
    } catch (error) {
      console.warn("⚠️ WHISPER STT: HTTP failed, falling back to Tauri:", error);
      // Fallback para Tauri se HTTP falhar
      return await fetchWhisperTauriSTT(audio);
    }
  } else {
    return await fetchWhisperTauriSTT(audio);
  }
}

/**
 * Função principal que tenta HTTP primeiro, depois Tauri automaticamente
 * Esta é a função que deve ser usada pelos componentes VAD
 */
export async function fetchWhisperSTTWithFallback(audio: File | Blob): Promise<string> {
  // Sempre tentar HTTP primeiro
  try {
    console.log("🔄 WHISPER STT: Attempting HTTP connection...");
    return await fetchWhisperHttpSTT(audio);
  } catch (error) {
    console.warn("⚠️ WHISPER STT: HTTP failed, using Tauri fallback:", error);
    try {
      return await fetchWhisperTauriSTT(audio);
    } catch (tauriError) {
      console.error("❌ WHISPER STT: Both HTTP and Tauri failed:", tauriError);
      throw new Error(`Transcription failed: ${tauriError}`);
    }
  }
}

/**
 * Função Tauri original (fallback)
 */
async function fetchWhisperTauriSTT(audio: File | Blob): Promise<string> {
  console.log("🎤 WHISPER TAURI STT: Using Tauri fallback...");
  
  try {
    // Importar função Tauri original
    const { invoke } = await import("@tauri-apps/api/core");
    
    // Converter áudio para base64
    const audioBase64 = await blobToBase64(audio);
    
    // Chamar comando Tauri
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

    if (response.success && response.transcription) {
      console.log("✅ WHISPER TAURI STT: Transcription successful!");
      return response.transcription;
    } else {
      console.warn("⚠️ WHISPER TAURI STT: Transcription failed:", response.error);
      return response.error || "WHISPER Tauri transcription failed";
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ WHISPER TAURI STT: Error:", errorMessage);
    return `WHISPER Tauri STT Error: ${errorMessage}`;
  }
}

/**
 * Função helper para converter blob para base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove o prefixo "data:audio/wav;base64,"
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
