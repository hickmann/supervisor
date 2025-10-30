/**
 * Sistema de Transcrição com Fila
 * 
 * Usa a fila de transcrição para evitar sobrecarga do whisper_server
 * quando terapeuta e paciente falam simultaneamente.
 */

import { getBestTranscription, getBestTranscriptionForTerapeuta } from './dual-transcription.function';
import { getTranscriptionQueue } from '../transcription-queue';

// Inicializar fila com transcriber
const queue = getTranscriptionQueue();

// Configurar a fila com parâmetros otimizados
queue.setThrottle(300); // 300ms entre transcrições (mais rápido que 500ms padrão)
queue.setMaxQueueSize(8); // Máximo de 8 tarefas na fila

// Função de transcrição que será usada pela fila
async function transcribeAudio(audioBlob: Blob): Promise<string> {
  // Esta função será chamada pela fila e decide qual método usar
  // baseado no contexto (será definido pela chamada)
  return await getBestTranscription(audioBlob);
}

// Configurar transcriber na fila
queue.setTranscriber(transcribeAudio);

/**
 * Transcreve áudio do TERAPEUTA usando a fila
 * Prioridade ALTA
 */
export async function transcribeTerapeutaAudio(audioBlob: Blob): Promise<string> {
  console.log('🎤 Queued Transcription (TERAPEUTA): Adding to queue...');
  
  try {
    // Usar getBestTranscriptionForTerapeuta diretamente para terapeuta
    // mas através da fila para controlar concorrência
    const originalTranscriber = queue['transcriber'];
    queue.setTranscriber(getBestTranscriptionForTerapeuta);
    
    const result = await queue.enqueue(audioBlob, 'terapeuta');
    
    // Restaurar transcriber original
    if (originalTranscriber) {
      queue.setTranscriber(originalTranscriber);
    }
    
    console.log('✅ Queued Transcription (TERAPEUTA): Success!');
    return result;
  } catch (error) {
    console.error('❌ Queued Transcription (TERAPEUTA): Failed:', error);
    throw error;
  }
}

/**
 * Transcreve áudio do PACIENTE usando a fila
 * Prioridade NORMAL
 */
export async function transcribePacienteAudio(audioBlob: Blob): Promise<string> {
  console.log('🎤 Queued Transcription (PACIENTE): Adding to queue...');
  
  try {
    const result = await queue.enqueue(audioBlob, 'paciente');
    console.log('✅ Queued Transcription (PACIENTE): Success!');
    return result;
  } catch (error) {
    console.error('❌ Queued Transcription (PACIENTE): Failed:', error);
    throw error;
  }
}

/**
 * Obtém o status atual da fila
 */
export function getQueueStatus() {
  return queue.getStatus();
}

/**
 * Limpa a fila (útil em caso de reset)
 */
export function clearQueue() {
  queue.clear();
}

