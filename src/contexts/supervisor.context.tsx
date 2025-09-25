import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { SupervisorItem, SupervisorContextType } from "@/types/supervisor.type";

const SupervisorContext = createContext<SupervisorContextType | undefined>(undefined);

export const SupervisorProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<SupervisorItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SupervisorItem | null>(null);

  const selectItem = useCallback((id: string | null) => {
    if (!id) {
      setSelectedItem(null);
      return;
    }
    
    // Casos especiais que não são SupervisorItem normais
    if (id === 'transcriptions') {
      setSelectedItem({
        id: 'transcriptions',
        title: 'Transcrições da Sessão',
        subtitle: 'Histórico completo da conversa',
        description: 'Transcrições da sessão entre paciente e terapeuta',
        createdAt: new Date().toISOString()
      });
      return;
    }
    
    const item = items.find(item => item.id === id);
    setSelectedItem(item || null);
  }, [items]);

  const addItems = useCallback((newItems: SupervisorItem[]) => {
    setItems(prevItems => {
      // Dedup by title and description content (not id) to avoid duplicates of same response
      const existingContent = new Set(prevItems.map(item => `${item.title}|${item.description.substring(0, 100)}`));
      const uniqueNewItems = newItems.filter(item => {
        const contentKey = `${item.title}|${item.description.substring(0, 100)}`;
        return !existingContent.has(contentKey);
      });
      
      if (uniqueNewItems.length === 0) return prevItems;
      
              // Combine and sort by createdAt descending, then limit to 5
              const combined = [...uniqueNewItems, ...prevItems]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5);
      
      return combined;
    });
  }, []);

  const value: SupervisorContextType = {
    items,
    selectedItem,
    selectItem,
    addItems,
  };

  return (
    <SupervisorContext.Provider value={value}>
      {children}
    </SupervisorContext.Provider>
  );
};

export const useSupervisor = () => {
  const context = useContext(SupervisorContext);
  if (!context) {
    throw new Error("useSupervisor must be used within a SupervisorProvider");
  }
  return context;
};
