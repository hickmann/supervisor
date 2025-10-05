import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type MicDevice = { 
  index: number; 
  label: string; 
};

export function MicrophoneSettings() {
  const [mics, setMics] = useState<MicDevice[]>([]);
  const [value, setValue] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Buscar dispositivos disponíveis
        const devices: MicDevice[] = await invoke("list_audio_devices");
        setMics(devices);
        
        // Carregar dispositivo salvo do localStorage
        const saved = localStorage.getItem("therapist.micIndex");
        const savedIndex = saved ? parseInt(saved, 10) : null;
        
        if (savedIndex !== null && !isNaN(savedIndex) && devices.some(d => d.index === savedIndex)) {
          setValue(String(savedIndex));
        } else if (devices.length > 0) {
          // Usar primeiro dispositivo como padrão
          setValue(String(devices[0].index));
        }
      } catch (err) {
        console.error("Failed to load audio devices:", err);
        setError(err instanceof Error ? err.message : "Failed to load devices");
      } finally {
        setLoading(false);
      }
    };

    loadDevices();
  }, []);

  const onChange = (val: string) => {
    try {
      setValue(val);
      localStorage.setItem("therapist.micIndex", val);
      console.log("Microphone device saved:", val);
    } catch (err) {
      console.error("Failed to save microphone selection:", err);
      setError(err instanceof Error ? err.message : "Failed to save selection");
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/90">
          Microfone do Terapeuta
        </label>
        <div className="w-full rounded-2xl border border-white/20 bg-white/5 px-3 py-2 text-left text-sm text-white/70">
          Carregando dispositivos...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/90">
          Microfone do Terapeuta
        </label>
        <div className="w-full rounded-2xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-left text-sm text-red-400">
          Erro: {error}
        </div>
        <p className="text-xs text-white/50">
          Verifique se o whisper_stream está disponível e tente novamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white/90">
        Microfone do Terapeuta
      </label>
      
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
      >
        <option value="" disabled>
          Selecionar microfone...
        </option>
        {mics.map((device) => (
          <option
            key={device.index}
            value={String(device.index)}
            className="bg-white/10 text-white"
          >
            [{device.index}] {device.label}
          </option>
        ))}
      </select>
      
      <p className="text-xs text-white/50">
        A seleção define o parâmetro <code className="bg-white/10 px-1 rounded">-c &lt;index&gt;</code> do <code className="bg-white/10 px-1 rounded">whisper_stream</code>.
      </p>
      
      {mics.length === 0 && (
        <p className="text-xs text-yellow-400">
          ⚠️ Nenhum microfone detectado. Verifique se há dispositivos de áudio conectados.
        </p>
      )}
    </div>
  );
}