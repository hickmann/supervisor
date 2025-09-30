# Sistema de Autenticação - CoterapIA

## ✅ Implementação Completa

O sistema de autenticação foi implementado com sucesso usando **Supabase Authentication**. Quando o usuário tenta iniciar a gravação de voz, o sistema verifica se ele está autenticado antes de permitir o acesso.

---

## 🔐 Funcionalidades

### 1. **Autenticação Obrigatória**
- **Antes**: Qualquer usuário podia iniciar a gravação de voz
- **Agora**: É necessário fazer login antes de usar o sistema de supervisão

### 2. **Modal de Login**
- Aparece automaticamente quando o usuário clica no botão **Play** sem estar autenticado
- Suporta:
  - ✅ Login com email e senha
  - ✅ Criação de nova conta
  - ✅ Validação de senha (mínimo 6 caracteres)
  - ✅ Confirmação de senha ao criar conta
  - ✅ Mensagens de erro amigáveis

### 3. **Informações do Usuário na Janela de Opções**
- Email do usuário logado
- Botão de logout
- Status da conta (Ativa)

### 4. **Token de Autenticação**
- O token JWT do usuário é armazenado globalmente no contexto
- Usado automaticamente em todas as chamadas à API do Supabase:
  - `session-summary`
  - `extract-tasks-agreements`
  - `assistente-clinico`

---

## 🏗️ Arquitetura

### **Contextos**
```
src/contexts/auth.context.tsx
```
- Gerencia estado de autenticação
- Métodos: `signIn()`, `signUp()`, `signOut()`, `getAccessToken()`
- Mantém sessão persistente entre recarregamentos

### **Componentes**
```
src/components/auth/LoginModal.tsx
```
- Modal de login/cadastro
- Validação de formulário
- Feedback visual de carregamento

```
src/components/settings/UserInfo.tsx
```
- Exibe informações do usuário logado
- Botão de logout
- Aparece na janela de configurações

### **Integração**

#### **Janela Principal** (`src/components/completion/Audio.tsx`)
- Verifica autenticação ao clicar no botão Play
- Se não autenticado: Dispara evento `showLoginInSupervision`
- Se autenticado: Inicia microfone normalmente
- Escuta evento `loginSuccessStartVAD` para iniciar após login

#### **Tela de Insights/Supervisão** (`src/components/supervisor/SupervisorScreen.tsx`)
- Escuta evento `showLoginInSupervision`
- Exibe modal de login **na tela de insights** (onde aparecem as análises)
- Modal de login aparece **separado** da janela inicial
- Após login bem-sucedido: Dispara evento `loginSuccessStartVAD`

---

## 🔄 Fluxo de Autenticação

### **Cenário 1: Usuário não autenticado**
1. Usuário clica no botão **▶️ Play** (microfone) na **janela inicial**
2. Sistema detecta que não há token válido
3. **Tela de insights/supervisão abre automaticamente**
4. **Modal de login aparece NA TELA DE INSIGHTS** (separado da janela inicial)
5. Usuário faz login ou cria conta na tela de insights
6. Sistema inicia o microfone automaticamente
7. Token é usado em todas as chamadas de API

### **Cenário 2: Usuário já autenticado**
1. Usuário clica no botão **▶️ Play** (microfone)
2. Sistema verifica token válido
3. Microfone inicia imediatamente
4. Janela de supervisão abre e token é usado em todas as chamadas de API

### **Cenário 3: Logout**
1. Usuário abre janela de configurações (⚙️)
2. Vê suas informações de conta no topo
3. Clica em "Sair"
4. Confirma logout
5. Sessão é encerrada
6. Próxima tentativa de captura requer novo login

---

## 🔑 Configuração do Supabase

### **Credenciais**
```javascript
URL: https://uwqdksfxzhnmkfqvnloq.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Autenticação**
- Provider: Email/Password
- Confirmação de email: Configurável no dashboard do Supabase
- Tokens JWT são gerados automaticamente

---

## 📦 Dependências Instaladas

```json
{
  "@supabase/supabase-js": "^2.x.x"
}
```

---

## 🎯 Pontos de Uso do Token

O token de autenticação é automaticamente injetado em todas as requisições para:

1. **Assistente Clínico** (`/functions/v1/assistente-clinico`)
   - Análise de conversas a cada 5 falas
   - Recomendações clínicas

2. **Resumo da Sessão** (`/functions/v1/session-summary`)
   - Geração de temas da sessão
   - Intervenções identificadas

3. **Tarefas e Acordos** (`/functions/v1/extract-tasks-agreements`)
   - Extração de tarefas combinadas
   - Acordos estabelecidos na sessão

---

## 🛡️ Segurança

### **Token Storage**
- Armazenado em memória durante a sessão
- Persistido automaticamente pelo Supabase SDK
- Renovação automática quando expira

### **Validação**
- Senha mínima de 6 caracteres
- Email deve ser válido
- Confirmação de senha obrigatória no cadastro

### **Fallback**
- Se o token não está disponível, usa a chave anon do Supabase
- Garante funcionamento básico mesmo sem autenticação (modo legado)

---

## 📝 Como Criar uma Conta

### **Via Interface**
1. Clique no botão **▶️ Play** (microfone) na janela inicial
2. **Janela de supervisão abre** com modal de login (separada da janela principal)
3. No modal de login, clique em "Não tem uma conta? **Criar conta**"
4. Preencha:
   - Email
   - Senha (mínimo 6 caracteres)
   - Confirmação de senha
5. Clique em "Criar Conta"
6. Verifique seu email (se configurado no Supabase)
7. Faça login na janela de supervisão

### **Configuração no Supabase**
Para desabilitar confirmação de email:
1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Vá em Authentication → Settings
3. Desabilite "Enable email confirmations"

---

## 🐛 Troubleshooting

### **Erro: "Email ou senha incorretos"**
- Verifique se digitou corretamente
- Certifique-se de que criou a conta antes

### **Erro: "Email já está cadastrado"**
- Use "Fazer login" em vez de "Criar conta"

### **Erro: "Confirme seu email"**
- Verifique sua caixa de entrada
- Ou desabilite confirmação de email no Supabase

### **Sessão expira rapidamente**
- Tokens JWT têm tempo de expiração configurável no Supabase
- O sistema renova automaticamente quando necessário

---

## ✨ Melhorias Futuras

- [ ] Recuperação de senha (forgot password)
- [ ] Login com Google/OAuth
- [ ] Perfis de usuário com configurações
- [ ] Histórico de sessões por usuário
- [ ] Compartilhamento de sessões entre usuários
- [ ] Controle de acesso baseado em roles

---

## 📄 Arquivos Modificados

### Novos Arquivos
- `src/contexts/auth.context.tsx`
- `src/components/auth/LoginModal.tsx`
- `src/components/auth/index.tsx`
- `src/components/settings/UserInfo.tsx`

### Arquivos Modificados
- `src/contexts/index.ts` - Export auth context
- `src/components/index.ts` - Export auth components
- `src/main.tsx` - Wrap app with AuthProvider
- `src/components/completion/Audio.tsx` - **Auth check + eventos de comunicação**
- `src/components/supervisor/SupervisorScreen.tsx` - **LoginModal na tela de insights**
- `src/components/settings/index.tsx` - Add UserInfo component
- `src/contexts/supervisor.context.tsx` - Use auth token in API calls
- `src/components/speech/Header.tsx` - Clean header (removed user info, moved to settings)

---

## 🎉 Status

**✅ SISTEMA DE AUTENTICAÇÃO TOTALMENTE FUNCIONAL**

- Login obrigatório para usar o sistema
- Token JWT usado em todas as APIs
- Interface de usuário completa
- Gerenciamento de sessão automático
- Logout funcional na janela de configurações
