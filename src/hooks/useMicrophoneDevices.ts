import { useState, useEffect } from "react";

export interface MicrophoneDevice {
  deviceId: string;
  label: string;
  groupId?: string;
}

export const useMicrophoneDevices = () => {
  const [devices, setDevices] = useState<MicrophoneDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Solicitar permissão de microfone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Enumerar dispositivos
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        
        // Filtrar apenas dispositivos de entrada de áudio
        const audioInputDevices = deviceList
          .filter((device) => device.kind === "audioinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Microfone ${device.deviceId.slice(0, 8)}`,
            groupId: device.groupId,
          }));

        setDevices(audioInputDevices);

        // Parar o stream temporário usado para obter permissão
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao carregar dispositivos";
        setError(errorMessage);
        console.error("Erro ao carregar dispositivos de microfone:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDevices();

    // Listar novamente quando dispositivos mudarem
    const handleDeviceChange = () => {
      loadDevices();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, []);

  return { devices, isLoading, error };
};

