# 🎉 CoterapIA - Sistema de Instalador Completo

## ✅ O que foi configurado

### 1. **Configuração do Tauri** (`src-tauri/tauri.conf.json`)
- ✅ Bundle configurado para todas as plataformas (Windows, Linux, macOS)
- ✅ Recursos incluídos: Whisper, modelos Vosk, bibliotecas nativas
- ✅ Executáveis externos do Whisper incluídos
- ✅ Configuração de instaladores MSI, NSIS, DEB, AppImage, DMG
- ✅ Dependências do sistema especificadas

### 2. **Scripts de Build Automatizados**
- ✅ `criar-instalador.ps1` - Script principal para Windows
- ✅ `build-installer.ps1` - Script de build completo
- ✅ `build-installer.sh` - Script para Linux/macOS
- ✅ `setup-dependencies.ps1` - Verificação de dependências

### 3. **Dependências Incluídas Automaticamente**
- ✅ **Whisper**: Todos os executáveis (16 arquivos)
- ✅ **DLLs Whisper**: Bibliotecas nativas (5 arquivos)
- ✅ **Vosk**: Modelo português e bibliotecas (4 arquivos)
- ✅ **Ícones**: Todos os formatos necessários (5 arquivos)

### 4. **Tipos de Instalador Suportados**

#### Windows
- **MSI**: Instalador padrão do Windows
- **NSIS**: Instalador personalizado

#### Linux
- **DEB**: Para Ubuntu/Debian
- **AppImage**: Executável portável

#### macOS
- **DMG**: Instalador para macOS

## 🚀 Como usar

### Método 1: Script Automatizado (Recomendado)
```powershell
# Windows
.\criar-instalador.ps1
```

```bash
# Linux/macOS
./build-installer.sh
```

### Método 2: Manual
```bash
# 1. Verificar dependências
.\setup-dependencies.ps1

# 2. Build do frontend
npm run build

# 3. Build do Tauri
cd src-tauri
cargo tauri build --bundles msi,nsis,appimage,deb,dmg
```

## 📁 Estrutura de Saída

Após o build, os instaladores estarão em:
```
distribuicao/
├── CoterapIA_0.1.1_x64_en-US.msi          # Windows MSI
├── CoterapIA_0.1.1_x64-setup.exe          # Windows NSIS
├── CoterapIA_0.1.1_amd64.AppImage         # Linux AppImage
├── CoterapIA_0.1.1_amd64.deb              # Linux DEB
├── CoterapIA_0.1.1_x64.dmg                # macOS DMG
├── INSTRUCOES_INSTALACAO.md               # Instruções
├── README.md                              # Documentação
└── LICENSE                                # Licença
```

## 🔧 Dependências do Sistema

### Windows
- Node.js 18+
- Rust 1.70+
- Visual Studio Build Tools
- WiX Toolset (para MSI)
- NSIS (para NSIS)

### Linux
- Node.js 18+
- Rust 1.70+
- build-essential
- libgtk-3-dev
- libwebkit2gtk-4.0-dev
- libayatana-appindicator3-dev
- librsvg2-dev
- libasound2-dev
- libpulse-dev

### macOS
- Node.js 18+
- Rust 1.70+
- Xcode Command Line Tools

## 📦 O que está incluído no instalador

### Whisper (Speech-to-Text)
- whisper-cli.exe
- whisper-server.exe
- whisper-stream.exe
- whisper-command.exe
- whisper-bench.exe
- whisper-talk-llama.exe
- stream.exe, command.exe, bench.exe
- lsp.exe, main.exe, quantize.exe
- vad-speech-segments.exe
- test-vad.exe, test-vad-full.exe
- wchess.exe

### Bibliotecas Whisper
- whisper.dll
- ggml.dll, ggml-base.dll, ggml-cpu.dll
- SDL2.dll

### Vosk (Reconhecimento de Voz)
- Modelo português: vosk-model-small-pt-0.3
- Bibliotecas nativas: libvosk.dll, libgcc_s_seh-1.dll, etc.

### Sistema
- WebView2 (Windows) / WebKit (Linux/macOS)
- Todas as dependências nativas
- Configuração automática

## 🎯 Vantagens do Sistema

1. **Instalação Completa**: Todas as dependências incluídas
2. **Multiplataforma**: Windows, Linux, macOS
3. **Automático**: Configuração sem intervenção manual
4. **Portável**: Funciona em qualquer computador
5. **Atualizável**: Sistema de atualizações automáticas
6. **Profissional**: Instaladores nativos de cada plataforma

## 🔍 Verificação

Para verificar se tudo está funcionando:

1. **Execute o script de verificação**:
   ```powershell
   .\setup-dependencies.ps1
   ```

2. **Teste o build**:
   ```powershell
   .\criar-instalador.ps1
   ```

3. **Verifique os instaladores**:
   - Os arquivos estarão em `distribuicao/`
   - Teste a instalação em uma máquina limpa

## 📞 Suporte

- **Documentação**: `INSTALADOR_README.md`
- **Configuração**: `src-tauri/tauri.conf.json`
- **Scripts**: `criar-instalador.ps1`, `setup-dependencies.ps1`
- **Logs**: `src-tauri/target/release/build.log`

## 🎉 Resultado Final

Com este sistema, você pode:

1. **Criar instaladores** com um comando
2. **Distribuir** para qualquer computador
3. **Instalar automaticamente** todas as dependências
4. **Funcionar imediatamente** após a instalação

O CoterapIA estará pronto para uso em qualquer computador, com Whisper, Vosk e todas as dependências configuradas automaticamente!
