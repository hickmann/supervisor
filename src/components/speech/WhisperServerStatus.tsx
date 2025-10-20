/**
 * Whisper Server Status
 * 
 * Componente simples para mostrar o status do whisper_server
 * e permitir iniciar/parar facilmente
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { 
  ServerIcon, 
  PlayIcon, 
  Square, 
  CheckCircleIcon,
  AlertTriangleIcon,
  LoaderIcon
} from 'lucide-react';

export const WhisperServerStatus: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkServerStatus = async () => {
    try {
      // Verificar se a porta 8000 está aberta (indicativo de que o servidor está rodando)
      await fetch('http://127.0.0.1:8000/health', { 
        method: 'GET',
        mode: 'no-cors' // Para evitar CORS
      });
      setIsRunning(true);
    } catch (error) {
      setIsRunning(false);
    }
  };

  const startServer = async () => {
    setIsLoading(true);
    try {
      // Usar o script PowerShell para iniciar o servidor
      await fetch('/api/start-whisper-server', {
        method: 'POST'
      });
      
      // Aguardar um pouco e verificar status
      setTimeout(() => {
        checkServerStatus();
        setIsLoading(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao iniciar servidor:', error);
      setIsLoading(false);
    }
  };

  const stopServer = async () => {
    setIsLoading(true);
    try {
      // Matar processo do whisper-server
      await fetch('/api/stop-whisper-server', {
        method: 'POST'
      });
      
      setIsRunning(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao parar servidor:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkServerStatus();
    // Verificar status a cada 5 segundos
    const interval = setInterval(checkServerStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => {
    if (isLoading) {
      return (
        <Badge variant="secondary">
          <LoaderIcon className="w-3 h-3 mr-1 animate-spin" />
          Carregando...
        </Badge>
      );
    }
    
    if (isRunning) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Servidor Ativo
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <AlertTriangleIcon className="w-3 h-3 mr-1" />
          Servidor Inativo
        </Badge>
      );
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ServerIcon className="w-4 h-4" />
          Whisper Server
        </CardTitle>
        <CardDescription className="text-xs">
          Status do servidor de transcrição
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Status:</span>
          {getStatusBadge()}
        </div>

        <div className="flex gap-2">
          {!isRunning ? (
            <Button 
              onClick={startServer} 
              disabled={isLoading}
              size="sm"
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="w-3 h-3 mr-1 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <PlayIcon className="w-3 h-3 mr-1" />
                  Iniciar
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={stopServer} 
              disabled={isLoading}
              variant="destructive"
              size="sm"
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="w-3 h-3 mr-1 animate-spin" />
                  Parando...
                </>
              ) : (
                <>
                  <Square className="w-3 h-3 mr-1" />
                  Parar
                </>
              )}
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Porta: 8000</p>
          <p>• Modelo: ggml-base-q5_1.bin</p>
          <p>• Idioma: Português</p>
        </div>
      </CardContent>
    </Card>
  );
};
