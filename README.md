# CoterapIA 🧠

<div align="center">

**Assistente de IA para Supervisão Clínica Psicológica**

[![Tauri](https://img.shields.io/badge/Built%20with-Tauri-orange)](https://tauri.app/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

[🌐 Website](https://www.CoterapIA.com.br) • [📖 Documentação](#documentação) • [🚀 Download](#download)

</div>

---

## 📋 Sobre o CoterapIA

O **CoterapIA** é uma aplicação desktop inovadora desenvolvida para auxiliar psicólogos e terapeutas durante sessões clínicas. Utilizando inteligência artificial avançada, o sistema oferece supervisão em tempo real, transcrição automática e insights clínicos para aprimorar a qualidade do atendimento.

### 🎯 **Principais Funcionalidades**

- **🎙️ Transcrição em Tempo Real**: Captura e transcreve conversas automaticamente
- **🤖 Supervisão Clínica**: IA especializada em psicologia clínica
- **📊 Análise de Sessões**: Identificação de temas e padrões nas conversas
- **💡 Sugestões Inteligentes**: Recomendações contextuais durante a sessão
- **🔒 Privacidade Total**: Dados processados localmente, sem armazenamento externo
- **⚡ Interface Minimalista**: Design limpo e não intrusivo

---

## 🚀 Download

### **Versões Disponíveis**

| Plataforma | Download | Versão |
|------------|----------|---------|
| **Windows** | [📥 Download](https://github.com/coterapia/coterapia/releases) | v1.0.0 |
| **macOS** | [📥 Download](https://github.com/coterapia/coterapia/releases) | v1.0.0 |
| **Linux** | [📥 Download](https://github.com/coterapia/coterapia/releases) | v1.0.0 |

---

## ✨ Funcionalidades Detalhadas

### 🎙️ **Captura de Áudio Inteligente**

- **Transcrição Automática**: Converte fala em texto em tempo real
- **Detecção de Voz**: Sistema VAD (Voice Activity Detection) avançado
- **Múltiplos Provedores**: Suporte a OpenAI Whisper, ElevenLabs, Google Speech
- **Qualidade HD**: Captura de áudio de alta qualidade

### 🧠 **Supervisão Clínica com IA**

- **Análise Contextual**: IA especializada em psicologia clínica
- **Identificação de Temas**: Extração automática de temas das sessões
- **Sugestões Terapêuticas**: Recomendações baseadas no contexto
- **Alertas Clínicos**: Notificações para situações que requerem atenção

### 📊 **Gestão de Sessões**

- **Histórico Completo**: Armazenamento local de todas as sessões
- **Resumos Automáticos**: Geração de resumos das sessões
- **Exportação**: Exportação de dados em múltiplos formatos
- **Busca Avançada**: Localização rápida de sessões específicas

### 🔒 **Privacidade e Segurança**

- **Processamento Local**: Dados nunca saem do seu computador
- **Criptografia**: Proteção de dados sensíveis
- **Conformidade**: Atende aos padrões de privacidade médica
- **Controle Total**: Você tem controle completo sobre seus dados

---

## 🛠️ Instalação e Configuração

### **Pré-requisitos**

- **Sistema Operacional**: Windows 10+, macOS 10.15+, ou Linux (Ubuntu 18.04+)
- **Memória RAM**: Mínimo 4GB (recomendado 8GB)
- **Espaço em Disco**: 100MB livres
- **Microfone**: Para captura de áudio

### **Instalação Rápida**

1. **Baixe** a versão para sua plataforma
2. **Execute** o instalador
3. **Configure** suas preferências na primeira execução
4. **Comece** a usar imediatamente

### **Configuração Inicial**

1. **Configurar Provedor de IA**: Escolha entre OpenAI, Claude, Gemini ou provedores customizados
2. **Configurar STT**: Selecione o provedor de transcrição (Whisper, ElevenLabs, etc.)
3. **Testar Áudio**: Verifique se o microfone está funcionando
4. **Personalizar Interface**: Ajuste as configurações visuais

---

## 🎮 Como Usar

### **Iniciando uma Sessão**

1. **Abra** o CoterapIA
2. **Clique** no botão de gravação (▶️)
3. **Inicie** sua sessão clínica
4. **Acompanhe** as transcrições em tempo real

### **Atalhos de Teclado**

| Atalho | Função |
|--------|--------|
| `Ctrl + Enter` | Enviar falas para análise da IA |
| `Ctrl + H` | Mostrar/Esconder aplicação |
| `Ctrl + Shift + A` | Iniciar/Parar gravação |

### **Recursos Avançados**

- **Ações Rápidas**: Botões para ações comuns durante a sessão
- **Resumo de Sessão**: Geração automática de resumos
- **Análise de Temas**: Identificação de padrões nas conversas
- **Sugestões Contextuais**: Recomendações baseadas no conteúdo

---

## 🔧 Configurações Avançadas

### **Provedores de IA Suportados**

- **OpenAI**: GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Haiku
- **Google**: Gemini Pro, Gemini Flash
- **xAI**: Grok
- **Provedores Customizados**: Suporte a APIs personalizadas

### **Provedores de Transcrição**

- **OpenAI Whisper**: Alta precisão, múltiplos idiomas
- **ElevenLabs**: Velocidade e qualidade
- **Google Speech-to-Text**: Integração com Google Cloud
- **Whisper Local**: Processamento completamente offline

### **Personalização**

- **Temas**: Modo claro/escuro
- **Idiomas**: Suporte a múltiplos idiomas
- **Configurações de Áudio**: Ajustes de qualidade e sensibilidade
- **Interface**: Personalização de layout e cores

---

## 🏗️ Arquitetura Técnica

### **Frontend**
- **React 18** com TypeScript
- **Tailwind CSS** para estilização
- **Tauri** para interface desktop nativa
- **Vite** para build otimizado

### **Backend**
- **Rust** com Tauri
- **Processamento de áudio** nativo
- **Integração com APIs** de IA
- **Armazenamento local** seguro

### **Recursos**
- **Tamanho**: ~15MB
- **RAM**: ~50MB em uso
- **CPU**: Baixo uso durante operação
- **Rede**: Apenas para chamadas de API

---

## 🔒 Privacidade e Conformidade

### **Compromisso com a Privacidade**

- ✅ **Dados Locais**: Tudo processado no seu computador
- ✅ **Sem Telemetria**: Nenhum dado enviado para servidores externos
- ✅ **Criptografia**: Dados sensíveis protegidos
- ✅ **Controle Total**: Você decide o que compartilhar

### **Conformidade Médica**

- **LGPD**: Conformidade com a Lei Geral de Proteção de Dados
- **CFP**: Alinhado com diretrizes do Conselho Federal de Psicologia
- **Ética Profissional**: Respeita códigos de ética da profissão

---

## 🤝 Contribuição

### **Como Contribuir**

1. **Fork** o repositório
2. **Crie** uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. **Push** para a branch (`git push origin feature/nova-funcionalidade`)
5. **Abra** um Pull Request

### **Diretrizes**

- **Código Limpo**: Siga as convenções de código
- **Testes**: Adicione testes para novas funcionalidades
- **Documentação**: Atualize a documentação quando necessário
- **Issues**: Use o sistema de issues para reportar bugs

---

## 📞 Suporte

### **Canais de Suporte**

- **📧 Email**: suporte@coterapia.com.br
- **💬 Discord**: [Servidor da Comunidade](https://discord.gg/coterapia)
- **📖 Wiki**: [Documentação Completa](https://github.com/coterapia/coterapia/wiki)
- **🐛 Issues**: [Reportar Bugs](https://github.com/coterapia/coterapia/issues)

### **FAQ**

**P: Os dados ficam seguros?**
R: Sim, todos os dados são processados localmente e nunca saem do seu computador.

**P: Funciona offline?**
R: A transcrição local funciona offline, mas a análise de IA requer conexão com internet.

**P: É compatível com meu sistema?**
R: Funciona em Windows, macOS e Linux com os requisitos mínimos.

---

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 🙏 Agradecimentos

- **Comunidade Open Source** pelo suporte contínuo
- **Tauri** pela excelente framework desktop
- **React** pela robustez do frontend
- **Rust** pela performance e segurança
- **Psicólogos e Terapeutas** que contribuíram com feedback

---

## 🔗 Links Úteis

- **🌐 Website**: [CoterapIA.com.br](https://www.CoterapIA.com.br)
- **📖 Documentação**: [Wiki do Projeto](https://github.com/coterapia/coterapia/wiki)
- **🐛 Reportar Bug**: [GitHub Issues](https://github.com/coterapia/coterapia/issues)
- **💬 Discussões**: [GitHub Discussions](https://github.com/coterapia/coterapia/discussions)
- **📧 Contato**: suporte@coterapia.com.br

---

<div align="center">

**Desenvolvido com ❤️ para a comunidade psicológica brasileira**

[![Website](https://img.shields.io/badge/Website-CoterapIA.com.br-blue?style=for-the-badge&logo=globe)](https://www.CoterapIA.com.br)
[![GitHub](https://img.shields.io/badge/GitHub-CoterapIA-black?style=for-the-badge&logo=github)](https://github.com/coterapia/coterapia)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge&logo=opensourceinitiative)](LICENSE)

</div>
