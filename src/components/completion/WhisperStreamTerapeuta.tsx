/**
 * WhisperStreamTerapeuta Component
 * 
 * Gerencia transcrição do terapeuta usando whisper-stream.exe
 * com VAD integrado. Não precisa de VAD externo.
 */

import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Button } from '../ui/button';
import { LoaderCircleIcon, MicIcon, MicOffIcon } from 'lucide-react';

interface WhisperTranscription {
  text: string;
  timestamp: string;
}

interface WhisperStreamTerapeutaProps {
  isEnabled: boolean;
  setEnableVAD: (enabled: boolean) => void;
  systemAudio?: any;
}

export function WhisperStreamTerapeuta({
  isEnabled,
  setEnableVAD,
  systemAudio,
}: WhisperStreamTerapeutaProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);
  const lastProcessedRef = useRef<string>(''); // Filtro de duplicação
  const processingRef = useRef<boolean>(false); // Evita processamento paralelo

  // Iniciar/parar whisper_stream baseado em isEnabled
  useEffect(() => {
    if (isEnabled && !isRunning) {
      startWhisperStream();
    } else if (!isEnabled && isRunning) {
      stopWhisperStream();
    }
  }, [isEnabled]);

  // Usar ref para systemAudio para evitar loop
  const systemAudioRef = useRef(systemAudio);
  
  useEffect(() => {
    systemAudioRef.current = systemAudio;
  }, [systemAudio]);

  // Escutar eventos de transcrição (setup apenas uma vez)
  useEffect(() => {
    const setupListener = async () => {
      console.log('🎤 WhisperStream: Setting up transcription listener...');

      const unlisten = await listen<WhisperTranscription>(
        'whisper-stream-transcription',
        async (event) => {
          const { text } = event.payload;
          console.log('🎤 WhisperStream: Received transcription:', text);

          // Filtro de duplicação: ignorar se for igual à última processada
          if (text === lastProcessedRef.current) {
            console.log('⚠️ WhisperStream: DUPLICATED transcription, skipping!');
            return;
          }

          // Filtro de processamento paralelo
          if (processingRef.current) {
            console.log('⚠️ WhisperStream: Already processing, skipping!');
            return;
          }

          if (text && text.trim().length > 0) {
            processingRef.current = true;
            lastProcessedRef.current = text;
            
            console.log('✅ WhisperStream: Valid transcription, processing:', text);
            setIsTranscribing(true);
            
            // Enviar transcrição para o sistema usando processMicrophoneTranscription
            const currentSystemAudio = systemAudioRef.current;
            if (currentSystemAudio && currentSystemAudio.processMicrophoneTranscription) {
              try {
                await currentSystemAudio.processMicrophoneTranscription(text.trim());
                console.log('✅ WhisperStream: Transcription sent to system successfully');
              } catch (error) {
                console.error('❌ WhisperStream: Error processing transcription:', error);
              }
            } else {
              console.warn('⚠️ WhisperStream: systemAudio.processMicrophoneTranscription not available');
            }
            
            // Reset transcribing state e processing flag após 1 segundo
            setTimeout(() => {
              setIsTranscribing(false);
              processingRef.current = false;
            }, 1000);
          } else {
            console.log('⚠️ WhisperStream: Empty transcription, skipping');
          }
        }
      );

      unlistenRef.current = unlisten;
      console.log('✅ WhisperStream: Listener setup complete');
    };

    setupListener();

    // Cleanup
    return () => {
      if (unlistenRef.current) {
        console.log('🛑 WhisperStream: Removing transcription listener');
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, []); // Array vazio = executa apenas uma vez

  const startWhisperStream = async () => {
    try {
      console.log('🚀 WhisperStream: Starting whisper-stream...');
      setError(null);

      const status = await invoke<{ is_running: boolean; pid?: number; error?: string }>(
        'start_whisper_stream'
      );

      if (status.is_running) {
        console.log(`✅ WhisperStream: Started successfully (PID: ${status.pid})`);
        setIsRunning(true);
      } else if (status.error) {
        const errorMsg = `Failed to start whisper-stream: ${status.error}`;
        console.error('❌ WhisperStream:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = `Error starting whisper-stream: ${err}`;
      console.error('❌ WhisperStream:', errorMsg);
      setError(errorMsg);
    }
  };

  const stopWhisperStream = async () => {
    try {
      console.log('🛑 WhisperStream: Stopping whisper-stream...');

      await invoke('stop_whisper_stream');

      console.log('✅ WhisperStream: Stopped successfully');
      setIsRunning(false);
    } catch (err) {
      console.error('❌ WhisperStream: Error stopping:', err);
    }
  };

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (isRunning) {
        console.log('🧹 WhisperStream: Component unmounting, stopping whisper-stream...');
        stopWhisperStream();
      }
    };
  }, []);

  const handleToggle = () => {
    if (isRunning) {
      stopWhisperStream();
      setEnableVAD(false);
    } else {
      startWhisperStream();
      setEnableVAD(true);
    }
  };

  const getButtonIcon = () => {
    if (isTranscribing) {
      return <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />;
    }
    if (isRunning) {
      return <MicOffIcon className="h-4 w-4 animate-pulse text-red-500" />;
    }
    return <MicIcon className="h-4 w-4" />;
  };

  const getButtonTitle = () => {
    if (isTranscribing) {
      return "Transcrevendo...";
    }
    if (isRunning) {
      return "Parar WhisperStream";
    }
    return "Iniciar WhisperStream";
  };

  return (
    <>
      <Button
        size="icon"
        onClick={handleToggle}
        className="cursor-pointer"
        title={getButtonTitle()}
      >
        {getButtonIcon()}
      </Button>
      {error && (
        <div className="error" style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
          {error}
        </div>
      )}
    </>
  );
}

