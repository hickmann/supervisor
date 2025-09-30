import { User, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts";
import { Button, Header } from "@/components";

interface UserInfoProps {
  className?: string;
}

export const UserInfo = ({ className }: UserInfoProps) => {
  const { user, signOut, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    if (confirm("Tem certeza que deseja sair?")) {
      await signOut();
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Header
          title="Conta de Usuário"
          description="Informações da sua conta"
          isMainTitle
        />
        <div className="flex items-center justify-center py-4 px-4 bg-muted/30 rounded-lg border border-input/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserCircle className="h-5 w-5" />
            <span>Não autenticado</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Header
        title="Conta de Usuário"
        description="Informações da sua conta e opções de logout"
        isMainTitle
      />
      <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg border border-input/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 border border-green-200 flex items-center justify-center">
            <User className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {user.email}
            </p>
            <p className="text-xs text-muted-foreground">
              Conta ativa
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
};
