import { Switch, Label, Header } from "@/components";
import { useApp } from "@/contexts";

interface AlwaysOnTopToggleProps {
  className?: string;
}

export const AlwaysOnTopToggle = ({ className }: AlwaysOnTopToggleProps) => {
  const { customizable, toggleAlwaysOnTop } = useApp();

  const handleSwitchChange = async (checked: boolean) => {
    await toggleAlwaysOnTop(checked);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Header
        title="Modo Sempre no Topo"
        description="Controla se a janela permanece acima de todas as outras aplicações"
        isMainTitle
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">
              {customizable.alwaysOnTop.isEnabled
                ? "Desabilitar Sempre no Topo"
                : "Habilitar Sempre no Topo"}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {customizable.alwaysOnTop.isEnabled
                ? "Janela permanece acima de todas as outras aplicações (padrão)"
                : "Janela se comporta como aplicações normais"}
            </p>
          </div>
        </div>
        <Switch
          checked={customizable.alwaysOnTop.isEnabled}
          onCheckedChange={handleSwitchChange}
          title={`Alternar para ${
            !customizable.alwaysOnTop.isEnabled ? "Habilitado" : "Desabilitado"
          } sempre no topo`}
          aria-label={`Alternar para ${
            customizable.alwaysOnTop.isEnabled ? "Habilitado" : "Desabilitado"
          } sempre no topo`}
        />
      </div>
    </div>
  );
};
