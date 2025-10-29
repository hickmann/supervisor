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
 * Garante que o whisper_server está rodando antes de tentar usar HTTP
 */
async function ensureWhisperServerRunning(): Promise<boolean> {
  try {
    // Verificar se já está rodando
    const isRunning = await invoke<boolean>('is_whisper_server_running');
    if (isRunning) {
      console.log('✅ Whisper Server: Already running, reusing existing server');
      return true;
    }
    
    // Tentar iniciar o servidor
    console.log('🚀 Whisper Server: Not running, starting server...');
    const serverResult = await invoke<{
      is_running: boolean;
      port: number | null;
      pid: number | null;
      error: string | null;
    }>('start_whisper_server');
    
    if (serverResult.is_running) {
      console.log('✅ Whisper Server: Started successfully on port', serverResult.port);
      return true;
    } else {
      console.warn('⚠️ Whisper Server: Failed to start:', serverResult.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Whisper Server: Error ensuring server is running:', error);
    return false;
  }
}

/**
 * Função otimizada para PACIENTE: Tenta HTTP primeiro (whisper_server), Tauri como fallback
 * Usa o mesmo servidor compartilhado
 */
export async function getBestTranscription(audioBlob: Blob): Promise<string> {
  console.log('🎯 Best Transcription (PACIENTE): Starting transcription with HTTP priority...');
  
  // Garantir que o servidor está rodando antes de tentar HTTP
  const serverRunning = await ensureWhisperServerRunning();
  
  // Primeiro: tentar HTTP (whisper_server) - PRINCIPAL para paciente
  if (serverRunning) {
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
  } else {
    console.warn('⚠️ Best Transcription: Server not running, skipping HTTP and trying Tauri');
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

/**
 * Função otimizada para TERAPEUTA: Tenta HTTP primeiro (whisper_server), Tauri como fallback
 * Usa o mesmo servidor compartilhado do paciente
 */
export async function getBestTranscriptionForTerapeuta(audioBlob: Blob): Promise<string> {
  console.log('🎯 Best Transcription (TERAPEUTA): Starting transcription with HTTP priority...');
  console.log('🎯 Best Transcription (TERAPEUTA): Audio blob size:', audioBlob.size, 'bytes');
  console.log('🎯 Best Transcription (TERAPEUTA): Audio blob type:', audioBlob.type);
  
  // Garantir que o servidor está rodando antes de tentar HTTP
  console.log('🔧 Best Transcription (TERAPEUTA): Ensuring whisper_server is running...');
  const serverRunning = await ensureWhisperServerRunning();
  console.log('🔧 Best Transcription (TERAPEUTA): Server running:', serverRunning);
  
  // Primeiro: tentar HTTP (whisper_server) - PRINCIPAL para terapeuta
  if (serverRunning) {
    try {
      console.log('🔄 Best Transcription (TERAPEUTA): Trying HTTP first (whisper_server)...');
      const httpTranscription = await transcribeWithHttp(audioBlob);
      console.log('📥 Best Transcription (TERAPEUTA): HTTP response received:', httpTranscription ? `"${httpTranscription.substring(0, 50)}..."` : 'null/empty');
      
      if (httpTranscription && httpTranscription.trim()) {
        console.log('✅ Best Transcription (TERAPEUTA): HTTP successful! Using whisper_server result');
        return httpTranscription;
      } else {
        console.warn('⚠️ Best Transcription (TERAPEUTA): HTTP returned empty or invalid transcription, trying Tauri fallback');
        console.warn('⚠️ Best Transcription (TERAPEUTA): HTTP response was:', httpTranscription);
      }
    } catch (error) {
      console.warn('⚠️ Best Transcription (TERAPEUTA): HTTP failed, trying Tauri fallback');
      console.warn('⚠️ Best Transcription (TERAPEUTA): HTTP error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  } else {
    console.warn('⚠️ Best Transcription (TERAPEUTA): Server not running, skipping HTTP and trying Tauri');
  }
  
  // Fallback: tentar Tauri (whisper_client)
  try {
    console.log('🔄 Best Transcription (TERAPEUTA): Trying Tauri fallback (whisper_client)...');
    const tauriTranscription = await transcribeWithTauri(audioBlob);
    console.log('📥 Best Transcription (TERAPEUTA): Tauri response received:', tauriTranscription ? `"${tauriTranscription.substring(0, 50)}..."` : 'null/empty');
    
    if (tauriTranscription && tauriTranscription.trim()) {
      console.log('✅ Best Transcription (TERAPEUTA): Tauri successful! Using whisper_client result (fallback)');
      return tauriTranscription;
    } else {
      console.warn('⚠️ Best Transcription (TERAPEUTA): Tauri returned empty or invalid transcription');
      console.warn('⚠️ Best Transcription (TERAPEUTA): Tauri response was:', tauriTranscription);
    }
  } catch (error) {
    console.error('❌ Best Transcription (TERAPEUTA): Tauri also failed');
    console.error('❌ Best Transcription (TERAPEUTA): Tauri error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
  
  // Se ambos falharam
  const errorMessage = 'Both HTTP and Tauri transcriptions failed';
  console.error('❌ Best Transcription (TERAPEUTA):', errorMessage);
  throw new Error(errorMessage);
}
