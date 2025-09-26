# 🚀 CoterapIA - Guia de Criação de Instalador

Este guia explica como criar um instalador completo do CoterapIA que inclui todas as dependências necessárias (Whisper, Vosk, etc.).

## 📋 Pré-requisitos

### Windows
- **Node.js** (versão 18 ou superior)
- **Rust** (versão 1.70 ou superior)
- **Visual Studio Build Tools** ou **Visual Studio Community**
- **WiX Toolset** (para MSI)
- **NSIS** (para NSIS installer)

### Linux
- **Node.js** (versão 18 ou superior)
- **Rust** (versão 1.70 ou superior)
- **build-essential**
- **libgtk-3-dev**
- **libwebkit2gtk-4.0-dev**
- **libayatana-appindicator3-dev**
- **librsvg2-dev**
- **libasound2-dev**
- **libpulse-dev**

### macOS
- **Node.js** (versão 18 ou superior)
- **Rust** (versão 1.70 ou superior)
- **Xcode Command Line Tools**

## 🔧 Configuração Inicial

### 1. Instalar dependências do sistema

#### Windows
```powershell
# Instalar WiX Toolset
winget install Microsoft.WiXToolset

# Instalar NSIS
winget install NSIS.NSIS
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install -y build-essential libgtk-3-dev libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev libasound2-dev libpulse-dev
```

#### macOS
```bash
# Instalar Xcode Command Line Tools
xcode-select --install
```

### 2. Preparar dependências do projeto

```bash
# Instalar dependências Node.js
npm install

# Instalar dependências Rust
cd src-tauri
cargo build
cd ..
```

## 📦 Estrutura de Dependências

O instalador inclui automaticamente:

### Whisper (Speech-to-Text)
- `whisper-cli.exe` - Interface de linha de comando
- `whisper-server.exe` - Servidor HTTP
- `whisper-stream.exe` - Streaming de áudio
- `whisper-command.exe` - Comandos personalizados
- `whisper-bench.exe` - Benchmark
- `whisper-talk-llama.exe` - Integração com LLaMA
- `stream.exe` - Streaming básico
- `command.exe` - Comandos auxiliares
- `bench.exe` - Benchmark auxiliar
- `lsp.exe` - Language Server Protocol
- `main.exe` - Executável principal
- `quantize.exe` - Quantização de modelos
- `vad-speech-segments.exe` - Detecção de atividade de voz
- `test-vad.exe` - Teste de VAD
- `test-vad-full.exe` - Teste completo de VAD
- `wchess.exe` - Utilitário de xadrez

### Bibliotecas Whisper
- `whisper.dll` - Biblioteca principal
- `ggml.dll` - Biblioteca de machine learning
- `ggml-base.dll` - Base GGML
- `ggml-cpu.dll` - GGML para CPU
- `SDL2.dll` - Biblioteca de mídia

### Vosk (Reconhecimento de Voz)
- Modelo português: `vosk-model-small-pt-0.3`
- Bibliotecas nativas: `libvosk.dll`, `libgcc_s_seh-1.dll`, etc.

## 🛠️ Processo de Build

### Método 1: Script Automatizado (Recomendado)

#### Windows
```powershell
# Verificar dependências
.\setup-dependencies.ps1

# Criar instalador
.\build-installer.ps1
```

#### Linux/macOS
```bash
# Verificar dependências
./setup-dependencies.sh

# Criar instalador
./build-installer.sh
```

### Método 2: Manual

#### 1. Verificar dependências
```bash
# Verificar se todos os arquivos estão presentes
ls whisper/
ls src-tauri/models/
ls src-tauri/vosk-libs/
```

#### 2. Build do frontend
```bash
npm run build
```

#### 3. Build do Tauri
```bash
cd src-tauri
cargo tauri build --bundles msi,nsis,appimage,deb,dmg
cd ..
```

## 📁 Estrutura de Saída

Após o build, os instaladores estarão em:

```
src-tauri/target/release/bundle/
├── msi/           # Instaladores MSI (Windows)
├── nsis/          # Instaladores NSIS (Windows)
├── appimage/      # AppImage (Linux)
├── deb/           # Pacotes DEB (Linux)
└── dmg/           # DMG (macOS)
```

## 🎯 Tipos de Instalador

### Windows
- **MSI**: Instalador padrão do Windows
  - Integração com Windows Installer
  - Desinstalação limpa
  - Atualizações automáticas
  
- **NSIS**: Instalador personalizado
  - Interface customizada
  - Mais opções de instalação
  - Menor tamanho

### Linux
- **DEB**: Para distribuições baseadas em Debian/Ubuntu
  - Integração com gerenciador de pacotes
  - Dependências automáticas
  
- **AppImage**: Executável portável
  - Funciona em qualquer distribuição
  - Não requer instalação
  - Auto-contido

### macOS
- **DMG**: Imagem de disco
  - Interface nativa do macOS
  - Arrastar e soltar para instalar
  - Código assinado (opcional)

## 🔍 Verificação de Instalador

### Testar instalação
1. Execute o instalador em uma máquina limpa
2. Verifique se todas as dependências foram instaladas
3. Teste a funcionalidade do Whisper
4. Teste o reconhecimento de voz Vosk

### Verificar arquivos incluídos
```bash
# Windows
dir "C:\Program Files\CoterapIA\"

# Linux
ls /opt/coterapia/

# macOS
ls /Applications/CoterapIA.app/Contents/
```

## 🚨 Solução de Problemas

### Erro: "Whisper not found"
- Verifique se os executáveis estão na pasta `whisper/`
- Confirme se as DLLs estão presentes
- Teste os executáveis manualmente

### Erro: "Vosk model not found"
- Verifique se o modelo está em `src-tauri/models/`
- Confirme se foi extraído corretamente
- Verifique as permissões de arquivo

### Erro: "Build failed"
- Verifique se todas as dependências do sistema estão instaladas
- Confirme se o Rust está atualizado
- Verifique se o Node.js está na versão correta

### Erro: "Installer creation failed"
- Verifique se o WiX Toolset está instalado (Windows)
- Confirme se o NSIS está instalado (Windows)
- Verifique as permissões de escrita

## 📞 Suporte

Para problemas com o instalador:

1. **Verifique os logs**: `src-tauri/target/release/build.log`
2. **Teste as dependências**: Execute `setup-dependencies.ps1`
3. **Verifique a configuração**: `tauri.conf.json`
4. **Consulte a documentação**: [Tauri Bundle](https://tauri.app/v1/guides/building/)

## 🎉 Resultado Final

Após o build bem-sucedido, você terá:

- ✅ Instaladores para todas as plataformas
- ✅ Todas as dependências incluídas
- ✅ Configuração automática
- ✅ Documentação de instalação
- ✅ Scripts de verificação

Os instaladores estarão prontos para distribuição e instalação em qualquer computador!
