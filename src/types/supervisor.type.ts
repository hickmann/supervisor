export type SupervisorItem = {
  id: string;
  title: string;
  description: string; // texto clínico
  createdAt: string; // ISO
};

export type SupervisorContextType = {
  items: SupervisorItem[];
  selectedItem: SupervisorItem | null;
  selectItem: (id: string | null) => void;
  addItems: (newItems: SupervisorItem[]) => void;
};
