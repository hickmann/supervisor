/**
 * Whisper HTTP Client
 * 
 * Cliente HTTP para comunicar com whisper_server
 * Substitui o WebSocket por HTTP REST API
 */

export interface WhisperHttpConfig {
  host?: string;
  port?: number;
  model?: string;
  language?: string;
}

export interface WhisperTranscriptionResponse {
  text: string;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}

export class WhisperHttpClient {
  private config: Required<WhisperHttpConfig>;
  private baseUrl: string;

  constructor(config: WhisperHttpConfig = {}) {
    this.config = {
      host: config.host || '127.0.0.1',
      port: config.port || 8000,
      model: config.model || 'ggml-base-q5_1.bin',
      language: config.language || 'pt',
    };
    this.baseUrl = `http://${this.config.host}:${this.config.port}`;
  }

  /**
   * Verifica se o servidor está rodando
   */
  async checkServerStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        mode: 'cors'
      });
      return response.ok;
    } catch (error) {
      console.error('❌ Whisper HTTP: Server not reachable:', error);
      return false;
    }
  }

  /**
   * Transcreve áudio via HTTP
   */
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      console.log('🔄 Whisper HTTP: Sending audio to server...');
      
      // Criar FormData para enviar o arquivo
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('temperature', '0.0');
      formData.append('response_format', 'json');
      
      const response = await fetch(`${this.baseUrl}/inference`, {
        method: 'POST',
        body: formData,
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📥 Whisper HTTP: Raw response:', result);
      
      // O whisper_server retorna o texto diretamente no campo 'text'
      const transcription = result.text || result;
      
      if (transcription && transcription.trim()) {
        console.log('✅ Whisper HTTP: Transcription successful!');
        console.log('📝 Whisper HTTP: TRANSCRIBED TEXT:', transcription);
        return transcription;
      } else {
        console.warn('⚠️ Whisper HTTP: Empty transcription received');
        return 'Transcrição vazia - nenhum texto detectado';
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Whisper HTTP: Error:', errorMessage);
      throw new Error(`WHISPER HTTP Error: ${errorMessage}`);
    }
  }

}

// Instância singleton para uso global
let whisperHttpClient: WhisperHttpClient | null = null;

/**
 * Obtém instância singleton do cliente HTTP
 */
export function getWhisperHttpClient(config?: WhisperHttpConfig): WhisperHttpClient {
  if (!whisperHttpClient) {
    whisperHttpClient = new WhisperHttpClient(config);
  }
  return whisperHttpClient;
}

/**
 * Função helper para transcrever áudio via HTTP
 */
export async function transcribeAudioWithHttp(audioBlob: Blob): Promise<string> {
  const client = getWhisperHttpClient();
  
  // Verificar se o servidor está rodando
  const isServerRunning = await client.checkServerStatus();
  if (!isServerRunning) {
    throw new Error('Whisper server is not running');
  }

  return await client.transcribeAudio(audioBlob);
}
