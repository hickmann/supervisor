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
  conceito_definicao?: {
    termo: string;
    definicao: string;
  };
  pergunta_e_resposta?: {
    pergunta: string;
    resposta_sugerida: string;
  };
  perguntas_exploratorias: string[];
  proximas_falas: string[];
  checagem_fatos?: Array<{
    afirmacao: string;
    avaliacao: string;
    justificativa: string;
    confianca: number;
    fontes_sugeridas: string[];
  }>;
};

export type SessionSummaryResponse = {
  temas: string[];
};

export type TaskAgreementItem = {
  descricao: string;
  responsavel: "paciente" | "terapeuta" | "ambos";
  prazo?: string | null;
  quando?: string | null;
};

export type TasksAgreementsResponse = {
  tarefas: TaskAgreementItem[];
  acordos: TaskAgreementItem[];
};

export type SupervisorContextType = {
  items: SupervisorItem[];
  selectedItem: SupervisorItem | null;
  selectItem: (id: string | null) => void;
  addItems: (newItems: SupervisorItem[]) => void;
  assistentClinicoData: AssistentClinicoResponse | null;
  conversationBuffer: Array<{ role: string; content: string; timestamp: number }>;
  addToConversationBuffer: (role: string, content: string) => void;
  sessionSummaryData: SessionSummaryResponse | null;
  isGeneratingSessionSummary: boolean;
  generateSessionSummary: (conversationHistory: Array<{ role: string; content: string; timestamp: number }>) => Promise<boolean>;
  sendToAssistentClinico: (conversations: Array<{ role: string; content: string; timestamp: number }>) => Promise<void>;
  isGeneratingAssistentClinico: boolean;
  tasksAgreementsData: TasksAgreementsResponse | null;
  isGeneratingTasksAgreements: boolean;
  generateTasksAgreements: (conversationHistory: Array<{ role: string; content: string; timestamp: number }>) => Promise<boolean>;
  error: string | null;
  setError: (error: string | null) => void;
};
