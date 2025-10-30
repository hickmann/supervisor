/**
 * Sistema de Fila de Transcrição
 * 
 * Gerencia transcrições de forma sequencial para evitar sobrecarga
 * do whisper_server quando terapeuta e paciente falam simultaneamente.
 */

interface TranscriptionTask {
  id: string;
  audioBlob: Blob;
  source: 'terapeuta' | 'paciente';
  priority: number; // 1 = alta (terapeuta), 2 = normal (paciente)
  timestamp: number;
  resolve: (value: string) => void;
  reject: (reason: any) => void;
}

class TranscriptionQueue {
  private queue: TranscriptionTask[] = [];
  private isProcessing: boolean = false;
  private transcriber: ((blob: Blob) => Promise<string>) | null = null;
  private lastTranscriptionTime: number = 0;
  private minTimeBetweenTranscriptions: number = 500; // 500ms entre transcrições
  private maxQueueSize: number = 5; // Máximo de 5 transcrições na fila

  /**
   * Define a função de transcrição a ser usada
   */
  setTranscriber(transcriber: (blob: Blob) => Promise<string>) {
    this.transcriber = transcriber;
  }

  /**
   * Define o tempo mínimo entre transcrições (throttle)
   */
  setThrottle(milliseconds: number) {
    this.minTimeBetweenTranscriptions = milliseconds;
  }

  /**
   * Define o tamanho máximo da fila
   */
  setMaxQueueSize(size: number) {
    this.maxQueueSize = size;
  }

  /**
   * Adiciona uma transcrição na fila
   */
  async enqueue(
    audioBlob: Blob,
    source: 'terapeuta' | 'paciente'
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Verificar se a fila está cheia
      if (this.queue.length >= this.maxQueueSize) {
        console.warn(`⚠️ Queue: Queue is full (${this.queue.length}/${this.maxQueueSize}), dropping oldest paciente task`);
        
        // Remover a tarefa mais antiga do paciente para dar espaço
        const oldestPacienteIndex = this.queue.findIndex(t => t.source === 'paciente');
        if (oldestPacienteIndex !== -1) {
          const dropped = this.queue.splice(oldestPacienteIndex, 1)[0];
          dropped.reject(new Error('Queue overflow: task dropped'));
          console.log(`🗑️ Queue: Dropped paciente task ${dropped.id}`);
        } else {
          // Se não há tarefas de paciente, rejeitar a nova
          reject(new Error('Queue is full'));
          return;
        }
      }

      const task: TranscriptionTask = {
        id: `${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        audioBlob,
        source,
        priority: source === 'terapeuta' ? 1 : 2,
        timestamp: Date.now(),
        resolve,
        reject,
      };

      this.queue.push(task);
      console.log(`📥 Queue: Added ${source} task ${task.id} (queue size: ${this.queue.length})`);

      // Ordenar por prioridade (terapeuta primeiro)
      this.queue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.timestamp - b.timestamp;
      });

      // Iniciar processamento se não estiver processando
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Processa a fila sequencialmente
   */
  private async processQueue() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift()!;

      try {
        console.log(`🔄 Queue: Processing ${task.source} task ${task.id} (${this.queue.length} remaining)`);

        // Throttling: aguardar tempo mínimo entre transcrições
        const timeSinceLastTranscription = Date.now() - this.lastTranscriptionTime;
        if (timeSinceLastTranscription < this.minTimeBetweenTranscriptions) {
          const waitTime = this.minTimeBetweenTranscriptions - timeSinceLastTranscription;
          console.log(`⏳ Queue: Throttling, waiting ${waitTime}ms...`);
          await this.sleep(waitTime);
        }

        // Verificar se há transcriber configurado
        if (!this.transcriber) {
          throw new Error('Transcriber not configured');
        }

        // Executar transcrição
        const startTime = Date.now();
        const transcription = await this.transcriber(task.audioBlob);
        const duration = Date.now() - startTime;

        console.log(`✅ Queue: ${task.source} task ${task.id} completed in ${duration}ms`);
        this.lastTranscriptionTime = Date.now();

        task.resolve(transcription);
      } catch (error) {
        console.error(`❌ Queue: ${task.source} task ${task.id} failed:`, error);
        task.reject(error);
      }
    }

    this.isProcessing = false;
    console.log('✅ Queue: All tasks processed');
  }

  /**
   * Retorna o estado atual da fila
   */
  getStatus() {
    return {
      queueSize: this.queue.length,
      isProcessing: this.isProcessing,
      tasks: this.queue.map(t => ({
        id: t.id,
        source: t.source,
        priority: t.priority,
        age: Date.now() - t.timestamp,
      })),
    };
  }

  /**
   * Limpa a fila
   */
  clear() {
    const rejected = this.queue.splice(0);
    rejected.forEach(task => {
      task.reject(new Error('Queue cleared'));
    });
    console.log(`🗑️ Queue: Cleared ${rejected.length} tasks`);
  }

  /**
   * Helper para aguardar
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton global
let transcriptionQueueInstance: TranscriptionQueue | null = null;

/**
 * Obtém a instância singleton da fila de transcrição
 */
export function getTranscriptionQueue(): TranscriptionQueue {
  if (!transcriptionQueueInstance) {
    transcriptionQueueInstance = new TranscriptionQueue();
    console.log('🎯 Queue: Initialized transcription queue');
  }
  return transcriptionQueueInstance;
}

/**
 * Reseta a fila (útil para testes)
 */
export function resetTranscriptionQueue() {
  if (transcriptionQueueInstance) {
    transcriptionQueueInstance.clear();
  }
  transcriptionQueueInstance = null;
  console.log('🔄 Queue: Reset transcription queue');
}

