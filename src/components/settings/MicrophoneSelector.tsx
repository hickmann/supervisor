import { useEffect, useState } from "react";
import { Label, Header, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components";
import { useMicrophoneDevices } from "@/hooks/useMicrophoneDevices";
import { safeLocalStorage } from "@/lib";
import { STORAGE_KEYS } from "@/config";
import { LoaderCircleIcon } from "lucide-react";

export const MicrophoneSelector = () => {
  const { devices, isLoading, error } = useMicrophoneDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("default");

  // Carregar dispositivo selecionado do storage
  useEffect(() => {
    const savedDeviceId = safeLocalStorage.getItem(STORAGE_KEYS.SELECTED_MICROPHONE_DEVICE_ID);
    if (savedDeviceId) {
      setSelectedDeviceId(savedDeviceId);
    } else {
      // Se não houver seleção salva, usar o primeiro dispositivo ou "default"
      if (devices.length > 0) {
        setSelectedDeviceId(devices[0].deviceId);
      }
    }
  }, [devices]);

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    safeLocalStorage.setItem(STORAGE_KEYS.SELECTED_MICROPHONE_DEVICE_ID, deviceId);
    console.log("🎤 Microphone selected:", deviceId);
    
    // Disparar evento para notificar outros componentes
    window.dispatchEvent(new CustomEvent("microphoneDeviceChanged"));
  };

  return (
    <div className="space-y-4">
      <Header
        title="Configuração do Microfone (Terapeuta)"
        description="Selecione qual microfone usar para o VAD do terapeuta"
        isMainTitle
      />
      
      <div className="space-y-2">
        <Label htmlFor="microphone-select" className="text-sm font-medium">
          Microfone para VAD do Terapeuta
        </Label>
        
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircleIcon className="h-4 w-4 animate-spin" />
            <span>Carregando microfones...</span>
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">
            Erro ao carregar microfones: {error}
          </div>
        ) : devices.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Nenhum microfone encontrado. Verifique se há microfones conectados e se as permissões foram concedidas.
          </div>
        ) : (
          <Select value={selectedDeviceId} onValueChange={handleDeviceChange}>
            <SelectTrigger id="microphone-select" className="w-full">
              <SelectValue placeholder="Selecione um microfone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">
                Padrão do Sistema
              </SelectItem>
              {devices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        <p className="text-xs text-muted-foreground">
          {devices.length > 0
            ? `${devices.length} microfone(s) encontrado(s). Selecione qual usar para detecção de voz do terapeuta.`
            : "Conecte um microfone e recarregue esta página para ver as opções disponíveis."}
        </p>
      </div>
    </div>
  );
};

