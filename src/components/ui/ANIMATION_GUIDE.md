# Guia de Animações - Componentes UI

Este guia explica como usar os novos componentes animados implementados no projeto.

## 🎨 Componentes Disponíveis

### AnimatedDialog
Substitui o `Dialog` padrão com animações suaves de slide-down.

```tsx
import { 
  AnimatedDialog, 
  AnimatedDialogContent, 
  AnimatedDialogHeader, 
  AnimatedDialogTitle, 
  AnimatedDialogDescription, 
  AnimatedDialogFooter 
} from "@/components/ui";

<AnimatedDialog open={isOpen} onOpenChange={setIsOpen}>
  <AnimatedDialogContent>
    <AnimatedDialogHeader>
      <AnimatedDialogTitle>Título do Modal</AnimatedDialogTitle>
      <AnimatedDialogDescription>
        Descrição do modal com animação suave.
      </AnimatedDialogDescription>
    </AnimatedDialogHeader>
    <AnimatedDialogFooter>
      <Button onClick={handleClose}>Fechar</Button>
    </AnimatedDialogFooter>
  </AnimatedDialogContent>
</AnimatedDialog>
```

### AnimatedPopover
Substitui o `Popover` padrão com animações de slide-down.

```tsx
import { 
  AnimatedPopover, 
  AnimatedPopoverTrigger, 
  AnimatedPopoverContent 
} from "@/components/ui";

<AnimatedPopover open={isOpen} onOpenChange={setIsOpen}>
  <AnimatedPopoverTrigger asChild>
    <Button>Abrir Popover</Button>
  </AnimatedPopoverTrigger>
  <AnimatedPopoverContent>
    <div>Conteúdo do popover com animação</div>
  </AnimatedPopoverContent>
</AnimatedPopover>
```

## ✨ Características das Animações

### Duração e Easing
- **Duração**: 300ms (0.3s)
- **Easing**: `ease-out` para movimento natural
- **Direção**: Slide-down (de cima para baixo)

### Estados de Animação
- **Abertura**: 
  - `slide-in-from-top-2` - Desliza de cima
  - `fade-in-0` - Aparece gradualmente
- **Fechamento**:
  - `slide-out-to-top-2` - Desliza para cima
  - `fade-out-0` - Desaparece gradualmente

### Classes CSS Utilizadas
```css
/* Abertura */
data-[state=open]:animate-in
data-[state=open]:fade-in-0
data-[state=open]:slide-in-from-top-2

/* Fechamento */
data-[state=closed]:animate-out
data-[state=closed]:fade-out-0
data-[state=closed]:slide-out-to-top-2

/* Duração */
duration-300 ease-out
```

## 🔄 Componentes Atualizados

Os seguintes componentes foram atualizados para usar as novas animações:

1. **ChatHistory** - Histórico de conversas
2. **Settings** - Painel de configurações
3. **SystemAudio** - Janela de supervisão de áudio
4. **DeleteConfirmationDialog** - Diálogo de confirmação

## 🎯 Benefícios

- **Experiência Visual**: Animações suaves e profissionais
- **Consistência**: Mesmo padrão em todas as janelas
- **Performance**: Animações otimizadas com CSS
- **Acessibilidade**: Mantém compatibilidade com screen readers
- **Reutilização**: Componentes prontos para uso em qualquer lugar

## 🚀 Como Usar em Novos Componentes

Para adicionar animações a novos componentes:

1. **Importe os componentes animados**:
```tsx
import { AnimatedPopover, AnimatedPopoverContent, AnimatedPopoverTrigger } from "@/components/ui";
```

2. **Substitua os componentes padrão**:
```tsx
// Antes
<Popover>
  <PopoverTrigger>...</PopoverTrigger>
  <PopoverContent>...</PopoverContent>
</Popover>

// Depois
<AnimatedPopover>
  <AnimatedPopoverTrigger>...</AnimatedPopoverTrigger>
  <AnimatedPopoverContent>...</AnimatedPopoverContent>
</AnimatedPopover>
```

3. **Mantenha as mesmas props**: Todos os componentes animados aceitam as mesmas props dos originais.

## 🎨 Personalização

Para personalizar as animações, você pode:

1. **Modificar a duração**:
```tsx
className="duration-500" // 500ms em vez de 300ms
```

2. **Alterar o easing**:
```tsx
className="ease-in-out" // Easing diferente
```

3. **Adicionar animações customizadas**:
```tsx
className="animate-bounce" // Animação adicional
```

## 📱 Responsividade

As animações são totalmente responsivas e funcionam em:
- Desktop (Windows, macOS, Linux)
- Mobile (quando aplicável)
- Diferentes tamanhos de tela

## 🔧 Troubleshooting

Se as animações não funcionarem:

1. **Verifique as importações**: Certifique-se de importar os componentes corretos
2. **Confirme o Tailwind**: As classes de animação dependem do Tailwind CSS
3. **Teste em diferentes navegadores**: Alguns navegadores podem ter comportamentos diferentes
4. **Verifique o z-index**: Certifique-se de que os elementos estão na camada correta

## 📚 Recursos Adicionais

- [Tailwind CSS Animations](https://tailwindcss.com/docs/animation)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [CSS Transitions Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions)
