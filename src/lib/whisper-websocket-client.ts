/**
 * Whisper WebSocket Client
 * 
 * Este cliente se conecta ao whisper_server via WebSocket para streaming de transcrições
 * em tempo real, substituindo o sistema atual de chamadas Tauri.
 */

export interface WhisperWebSocketConfig {
  host?: string;
  port?: number;
  model?: string;
  language?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface WhisperTranscriptionMessage {
  type: 'transcription' | 'error' | 'status';
  data: {
    text?: string;
    segments?: Array<{
      id: number;
      start: number;
      end: number;
      text: string;
    }>;
    error?: string;
    status?: string;
  };
  timestamp: number;
}

export class WhisperWebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WhisperWebSocketConfig>;
  private reconnectAttempts = 0;
  private isConnecting = false;
  private listeners: Map<string, ((message: WhisperTranscriptionMessage) => void)[]> = new Map();

  constructor(config: WhisperWebSocketConfig = {}) {
    this.config = {
      host: config.host || 'localhost',
      port: config.port || 8000,
      model: config.model || 'ggml-base-q5_1.bin',
      language: config.language || 'pt',
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
    };
  }

  /**
   * Conecta ao whisper_server via WebSocket
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('🔌 Whisper WebSocket: Already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('🔌 Whisper WebSocket: Connection in progress...');
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = `ws://${this.config.host}:${this.config.port}`;
      console.log(`🔌 Whisper WebSocket: Connecting to ${wsUrl}`);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Whisper WebSocket: Connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Enviar configuração inicial
        this.sendConfig();
        
        this.emit('status', {
          type: 'status',
          data: { status: 'connected' },
          timestamp: Date.now(),
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WhisperTranscriptionMessage = JSON.parse(event.data);
          console.log('📨 Whisper WebSocket: Message received:', message);
          this.emit(message.type, message);
        } catch (error) {
          console.error('❌ Whisper WebSocket: Failed to parse message:', error);
          this.emit('error', {
            type: 'error',
            data: { error: 'Failed to parse server message' },
            timestamp: Date.now(),
          });
        }
      };

      this.ws.onclose = (event) => {
        console.log(`🔌 Whisper WebSocket: Connection closed (${event.code}: ${event.reason})`);
        this.isConnecting = false;
        
        this.emit('status', {
          type: 'status',
          data: { status: 'disconnected' },
          timestamp: Date.now(),
        });

        // Tentar reconectar se não foi fechamento intencional
        if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Whisper WebSocket: Connection error:', error);
        this.isConnecting = false;
        
        this.emit('error', {
          type: 'error',
          data: { error: 'WebSocket connection error' },
          timestamp: Date.now(),
        });
      };

    } catch (error) {
      console.error('❌ Whisper WebSocket: Failed to create connection:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Envia configuração inicial para o servidor
   */
  private sendConfig(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const config = {
      type: 'config',
      data: {
        model: this.config.model,
        language: this.config.language,
      },
    };

    this.ws.send(JSON.stringify(config));
    console.log('⚙️ Whisper WebSocket: Configuration sent:', config);
  }

  /**
   * Envia áudio para transcrição
   */
  async sendAudio(audioBlob: Blob): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    try {
      // Converter blob para ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Criar mensagem de áudio
      const audioMessage = {
        type: 'audio',
        data: {
          audio: Array.from(new Uint8Array(arrayBuffer)),
          format: 'wav',
          sampleRate: 16000,
        },
        timestamp: Date.now(),
      };

      this.ws.send(JSON.stringify(audioMessage));
      console.log('🎤 Whisper WebSocket: Audio sent, size:', audioBlob.size, 'bytes');

    } catch (error) {
      console.error('❌ Whisper WebSocket: Failed to send audio:', error);
      throw error;
    }
  }

  /**
   * Agenda reconexão automática
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`🔄 Whisper WebSocket: Scheduling reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.reconnectAttempts <= this.config.maxReconnectAttempts) {
        this.connect().catch(console.error);
      } else {
        console.error('❌ Whisper WebSocket: Max reconnection attempts reached');
        this.emit('error', {
          type: 'error',
          data: { error: 'Max reconnection attempts reached' },
          timestamp: Date.now(),
        });
      }
    }, delay);
  }

  /**
   * Adiciona listener para eventos
   */
  on(event: string, callback: (message: WhisperTranscriptionMessage) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove listener
   */
  off(event: string, callback: (message: WhisperTranscriptionMessage) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * Emite evento para todos os listeners
   */
  private emit(event: string, message: WhisperTranscriptionMessage): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error(`❌ Whisper WebSocket: Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Desconecta do WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      console.log('🔌 Whisper WebSocket: Disconnecting...');
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Obtém status da conexão
   */
  getStatus(): string {
    if (this.isConnecting) return 'connecting';
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }
}

// Instância singleton para uso global
let whisperClient: WhisperWebSocketClient | null = null;

/**
 * Obtém instância singleton do cliente WebSocket
 */
export function getWhisperWebSocketClient(config?: WhisperWebSocketConfig): WhisperWebSocketClient {
  if (!whisperClient) {
    whisperClient = new WhisperWebSocketClient(config);
  }
  return whisperClient;
}

/**
 * Função helper para transcrever áudio via WebSocket
 */
export async function transcribeAudioWithWebSocket(audioBlob: Blob): Promise<string> {
  const client = getWhisperWebSocketClient();
  
  if (!client.isConnected()) {
    console.log('🔌 Whisper WebSocket: Connecting for transcription...');
    await client.connect();
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Transcription timeout'));
    }, 30000); // 30 segundos timeout

    const handleTranscription = (message: WhisperTranscriptionMessage) => {
      if (message.type === 'transcription' && message.data.text) {
        clearTimeout(timeout);
        client.off('transcription', handleTranscription);
        resolve(message.data.text);
      }
    };

    const handleError = (message: WhisperTranscriptionMessage) => {
      clearTimeout(timeout);
      client.off('transcription', handleTranscription);
      client.off('error', handleError);
      reject(new Error(message.data.error || 'Transcription failed'));
    };

    client.on('transcription', handleTranscription);
    client.on('error', handleError);

    client.sendAudio(audioBlob).catch(reject);
  });
}
