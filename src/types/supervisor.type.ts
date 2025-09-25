export type SupervisorItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string; // texto clínico
  createdAt: string; // ISO
};

export type AssistentClinicoResponse = {
  topico: string;
  resumo: string[];
  conceito_definicao: {
    termo: string;
    definicao: string;
  };
  pergunta_e_resposta: {
    pergunta: string;
    resposta_sugerida: string;
  };
  perguntas_exploratorias: string[];
  proximas_falas: string[];
};

export type SupervisorContextType = {
  items: SupervisorItem[];
  selectedItem: SupervisorItem | null;
  selectItem: (id: string | null) => void;
  addItems: (newItems: SupervisorItem[]) => void;
  assistentClinicoData: AssistentClinicoResponse | null;
  conversationBuffer: Array<{ role: string; content: string; timestamp: number }>;
  addToConversationBuffer: (role: string, content: string) => void;
};
