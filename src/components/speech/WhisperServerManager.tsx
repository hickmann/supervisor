/**
 * Whisper Server Manager
 * 
 * Componente para gerenciar a conexão com o whisper_server
 * Inicia o servidor automaticamente e monitora o status da conexão
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  ServerIcon, 
  PlayIcon, 
  Square, 
  WifiIcon, 
  WifiOffIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  LoaderIcon
} from 'lucide-react';
import { getWhisperWebSocketClient } from '@/lib/whisper-websocket-client';
import { invoke } from '@tauri-apps/api/core';

interface WhisperServerStatus {
  isRunning: boolean;
  isConnected: boolean;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error?: string;
  port?: number;
}

export const WhisperServerManager: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<WhisperServerStatus>({
    isRunning: false,
    isConnected: false,
    status: 'disconnected'
  });
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const client = getWhisperWebSocketClient();

  useEffect(() => {
    // Configurar listeners do WebSocket
    const handleConnectionStatus = (message: any) => {
      if (message.type === 'status') {
        const isConnected = message.data.status === 'connected';
        setServerStatus(prev => ({
          ...prev,
          isConnected,
          status: isConnected ? 'connected' : 'disconnected'
        }));
      }
    };

    const handleError = (message: any) => {
      setServerStatus(prev => ({
        ...prev,
        status: 'error',
        error: message.data.error
      }));
    };

    client.on('status', handleConnectionStatus);
    client.on('error', handleError);

    // Verificar status inicial
    checkServerStatus();

    return () => {
      client.off('status', handleConnectionStatus);
      client.off('error', handleError);
    };
  }, []);

  const checkServerStatus = async () => {
    try {
      // Verificar se o processo do whisper_server está rodando
      const isRunning = await invoke<boolean>('is_whisper_server_running');
      setServerStatus(prev => ({
        ...prev,
        isRunning,
        isConnected: client.isConnected()
      }));
    } catch (error) {
      console.error('Erro ao verificar status do servidor:', error);
    }
  };

  const startWhisperServer = async () => {
    if (isStarting) return;
    
    setIsStarting(true);
    try {
      console.log('🚀 Iniciando whisper_server...');
      await invoke('start_whisper_server');
      
      // Aguardar um pouco para o servidor inicializar
      setTimeout(async () => {
        await checkServerStatus();
        // Tentar conectar ao WebSocket
        try {
          await client.connect();
        } catch (error) {
          console.error('Erro ao conectar WebSocket:', error);
        }
        setIsStarting(false);
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao iniciar whisper_server:', error);
      setServerStatus(prev => ({
        ...prev,
        status: 'error',
        error: `Erro ao iniciar servidor: ${error}`
      }));
      setIsStarting(false);
    }
  };

  const stopWhisperServer = async () => {
    if (isStopping) return;
    
    setIsStopping(true);
    try {
      console.log('🛑 Parando whisper_server...');
      client.disconnect();
      await invoke('stop_whisper_server');
      setServerStatus({
        isRunning: false,
        isConnected: false,
        status: 'disconnected'
      });
    } catch (error) {
      console.error('Erro ao parar whisper_server:', error);
    } finally {
      setIsStopping(false);
    }
  };

  const connectWebSocket = async () => {
    try {
      await client.connect();
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
    }
  };

  const getStatusBadge = () => {
    switch (serverStatus.status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500"><CheckCircleIcon className="w-3 h-3 mr-1" />Conectado</Badge>;
      case 'connecting':
        return <Badge variant="secondary"><LoaderIcon className="w-3 h-3 mr-1 animate-spin" />Conectando</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangleIcon className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline"><WifiOffIcon className="w-3 h-3 mr-1" />Desconectado</Badge>;
    }
  };

  const getServerBadge = () => {
    if (serverStatus.isRunning) {
      return <Badge variant="default" className="bg-blue-500"><ServerIcon className="w-3 h-3 mr-1" />Servidor Ativo</Badge>;
    } else {
      return <Badge variant="outline"><ServerIcon className="w-3 h-3 mr-1" />Servidor Inativo</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ServerIcon className="w-5 h-5" />
          Whisper Server
        </CardTitle>
        <CardDescription>
          Gerenciar conexão com whisper_server para transcrições em tempo real
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status do Servidor */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Servidor:</span>
          {getServerBadge()}
        </div>
        
        {/* Status da Conexão */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">WebSocket:</span>
          {getStatusBadge()}
        </div>

        {/* Porta */}
        {serverStatus.port && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Porta:</span>
            <Badge variant="outline">{serverStatus.port}</Badge>
          </div>
        )}

        {/* Erro */}
        {serverStatus.error && (
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertDescription>{serverStatus.error}</AlertDescription>
          </Alert>
        )}

        {/* Botões de Controle */}
        <div className="flex gap-2">
          {!serverStatus.isRunning ? (
            <Button 
              onClick={startWhisperServer} 
              disabled={isStarting}
              className="flex-1"
            >
              {isStarting ? (
                <>
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <PlayIcon className="w-4 h-4 mr-2" />
                  Iniciar Servidor
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={stopWhisperServer} 
              disabled={isStopping}
              variant="destructive"
              className="flex-1"
            >
              {isStopping ? (
                <>
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                  Parando...
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Parar Servidor
                </>
              )}
            </Button>
          )}

          {serverStatus.isRunning && !serverStatus.isConnected && (
            <Button 
              onClick={connectWebSocket}
              variant="outline"
              className="flex-1"
            >
              <WifiIcon className="w-4 h-4 mr-2" />
              Conectar
            </Button>
          )}
        </div>

        {/* Informações Adicionais */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Servidor: whisper_server.exe</p>
          <p>• Modelo: ggml-base-q5_1.bin</p>
          <p>• Idioma: Português (pt)</p>
          <p>• Protocolo: WebSocket</p>
        </div>
      </CardContent>
    </Card>
  );
};
