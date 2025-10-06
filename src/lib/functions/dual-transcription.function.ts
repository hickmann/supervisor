/**
 * Dual Transcription Function
 * 
 * Envia transcrições do terapeuta para ambos:
 * 1. whisper_client (via Tauri) - sistema atual
 * 2. whisper_server (via HTTP) - novo sistema
 */

import { transcribeAudioWithHttp } from '../whisper-http-client';
import { invoke } from '@tauri-apps/api/core';

export interface DualTranscriptionResult {
  tauriTranscription: string;
  httpTranscription: string;
  tauriSuccess: boolean;
  httpSuccess: boolean;
  errors: string[];
}

/**
 * Converte blob para base64
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

/**
 * Transcreve áudio via Tauri (sistema atual)
 */
async function transcribeWithTauri(audioBlob: Blob): Promise<string> {
  try {
    console.log('🔄 Dual Transcription: Starting Tauri transcription...');
    
    // Converter áudio para base64
    const audioBase64 = await blobToBase64(audioBlob);
    
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
      console.log('✅ Dual Transcription: Tauri transcription successful!');
      console.log('📝 Dual Transcription: Tauri result:', response.transcription);
      return response.transcription;
    } else {
      throw new Error(response.error || 'Tauri transcription failed');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Dual Transcription: Tauri error:', errorMessage);
    throw error;
  }
}

/**
 * Transcreve áudio via HTTP (whisper_server)
 */
async function transcribeWithHttp(audioBlob: Blob): Promise<string> {
  try {
    console.log('🔄 Dual Transcription: Starting HTTP transcription...');
    
    const transcription = await transcribeAudioWithHttp(audioBlob);
    
    console.log('✅ Dual Transcription: HTTP transcription successful!');
    console.log('📝 Dual Transcription: HTTP result:', transcription);
    return transcription;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Dual Transcription: HTTP error:', errorMessage);
    throw error;
  }
}

/**
 * Função principal: transcreve áudio via ambos os sistemas
 */
export async function transcribeWithDualSystems(audioBlob: Blob): Promise<DualTranscriptionResult> {
  console.log('🎯 Dual Transcription: Starting dual transcription...');
  console.log('📊 Dual Transcription: Audio size:', audioBlob.size, 'bytes');
  
  const result: DualTranscriptionResult = {
    tauriTranscription: '',
    httpTranscription: '',
    tauriSuccess: false,
    httpSuccess: false,
    errors: []
  };

  // Executar ambas as transcrições em paralelo
  const promises = [
    transcribeWithTauri(audioBlob).then(transcription => {
      result.tauriTranscription = transcription;
      result.tauriSuccess = true;
      console.log('✅ Dual Transcription: Tauri completed successfully');
    }).catch(error => {
      result.errors.push(`Tauri: ${error.message || error}`);
      console.error('❌ Dual Transcription: Tauri failed:', error);
    }),
    
    transcribeWithHttp(audioBlob).then(transcription => {
      result.httpTranscription = transcription;
      result.httpSuccess = true;
      console.log('✅ Dual Transcription: HTTP completed successfully');
    }).catch(error => {
      result.errors.push(`HTTP: ${error.message || error}`);
      console.error('❌ Dual Transcription: HTTP failed:', error);
    })
  ];

  // Aguardar ambas as transcrições
  await Promise.allSettled(promises);

  // Log do resultado final
  console.log('📊 Dual Transcription: Final results:');
  console.log('  - Tauri success:', result.tauriSuccess);
  console.log('  - HTTP success:', result.httpSuccess);
  console.log('  - Errors:', result.errors);
  
  if (result.tauriSuccess) {
    console.log('📝 Dual Transcription: Tauri transcription:', result.tauriTranscription);
  }
  if (result.httpSuccess) {
    console.log('📝 Dual Transcription: HTTP transcription:', result.httpTranscription);
  }

  return result;
}

/**
 * Função otimizada que tenta HTTP primeiro, Tauri como fallback
 * Mais eficiente que executar ambos simultaneamente
 */
export async function getBestTranscription(audioBlob: Blob): Promise<string> {
  console.log('🎯 Best Transcription: Starting optimized transcription...');
  
  // Primeiro: tentar HTTP (whisper_server)
  try {
    console.log('🔄 Best Transcription: Trying HTTP first (whisper_server)...');
    const httpTranscription = await transcribeWithHttp(audioBlob);
    
    if (httpTranscription && httpTranscription.trim()) {
      console.log('✅ Best Transcription: HTTP successful! Using whisper_server result');
      return httpTranscription;
    }
  } catch (error) {
    console.warn('⚠️ Best Transcription: HTTP failed, trying Tauri fallback:', error);
  }
  
  // Fallback: tentar Tauri (whisper_client)
  try {
    console.log('🔄 Best Transcription: Trying Tauri fallback (whisper_client)...');
    const tauriTranscription = await transcribeWithTauri(audioBlob);
    
    if (tauriTranscription && tauriTranscription.trim()) {
      console.log('✅ Best Transcription: Tauri successful! Using whisper_client result (fallback)');
      return tauriTranscription;
    }
  } catch (error) {
    console.error('❌ Best Transcription: Tauri also failed:', error);
  }
  
  // Se ambos falharam
  const errorMessage = 'Both HTTP and Tauri transcriptions failed';
  console.error('❌ Best Transcription:', errorMessage);
  throw new Error(errorMessage);
}
