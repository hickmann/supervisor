import { Switch, Label, Header } from "@/components";
import { useApp } from "@/contexts";

interface AppIconToggleProps {
  className?: string;
}

export const AppIconToggle = ({ className }: AppIconToggleProps) => {
  const { customizable, toggleAppIconVisibility } = useApp();

  const handleSwitchChange = async (checked: boolean) => {
    await toggleAppIconVisibility(checked);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Header
        title="Modo Furtivo do Ícone"
        description="Controla a visibilidade do ícone na dock/barra de tarefas quando a janela está oculta para máxima discrição"
        isMainTitle
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">
              {!customizable.appIcon.isVisible
                ? "Mostrar Ícone na Dock/Barra de Tarefas"
                : "Ocultar Ícone da Dock/Barra de Tarefas"}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {`Alternar para tornar o Ícone do App ${
                !customizable.appIcon.isVisible ? "Visível" : "Oculto"
              }`}
            </p>
          </div>
        </div>
        <Switch
          checked={customizable.appIcon.isVisible}
          onCheckedChange={handleSwitchChange}
          aria-label="Alternar visibilidade do ícone do app"
        />
      </div>
    </div>
  );
};
