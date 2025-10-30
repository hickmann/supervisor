/**
 * Componente de Status da Fila de Transcrição
 * 
 * Mostra o status atual da fila de transcrições e
 * quantas transcrições estão aguardando processamento.
 */

import { useEffect, useState } from "react";
import { getQueueStatus } from "@/lib/functions/queued-transcription.function";
import { Badge } from "@/components/ui/badge";
import { Loader2Icon, CheckCircleIcon, AlertCircleIcon } from "lucide-react";

interface QueueStatus {
  queueSize: number;
  isProcessing: boolean;
  tasks: Array<{
    id: string;
    source: string;
    priority: number;
    age: number;
  }>;
}

export const TranscriptionQueueStatus = () => {
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    queueSize: 0,
    isProcessing: false,
    tasks: [],
  });

  useEffect(() => {
    // Atualizar status da fila a cada 500ms
    const interval = setInterval(() => {
      const status = getQueueStatus();
      setQueueStatus(status);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Não mostrar se não há nada na fila e não está processando
  if (queueStatus.queueSize === 0 && !queueStatus.isProcessing) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border">
      {queueStatus.isProcessing ? (
        <>
          <Loader2Icon className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm text-muted-foreground">
            Processando transcrição...
          </span>
        </>
      ) : queueStatus.queueSize > 0 ? (
        <>
          <AlertCircleIcon className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-muted-foreground">
            {queueStatus.queueSize} transcrição(ões) na fila
          </span>
        </>
      ) : (
        <>
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
          <span className="text-sm text-muted-foreground">
            Fila vazia
          </span>
        </>
      )}
      
      {queueStatus.tasks.length > 0 && (
        <div className="flex gap-1">
          {queueStatus.tasks.map((task) => (
            <Badge
              key={task.id}
              variant={task.source === "terapeuta" ? "default" : "secondary"}
              className="text-xs"
            >
              {task.source === "terapeuta" ? "T" : "P"}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

