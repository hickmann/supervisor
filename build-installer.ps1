# Script de Build para CoterapIA - Instalador Completo
# Este script prepara e constrói o instalador com todas as dependências

Write-Host "🚀 Iniciando build do CoterapIA com instalador completo..." -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "src-tauri/tauri.conf.json")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto CoterapIA" -ForegroundColor Red
    exit 1
}

# 1. Limpar builds anteriores
Write-Host "🧹 Limpando builds anteriores..." -ForegroundColor Yellow
if (Test-Path "src-tauri/target/release") {
    Remove-Item -Recurse -Force "src-tauri/target/release"
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

# 2. Instalar dependências Node.js
Write-Host "📦 Instalando dependências Node.js..." -ForegroundColor Yellow
npm install --force

# 3. Build do frontend
Write-Host "🏗️ Construindo frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build do frontend" -ForegroundColor Red
    exit 1
}

# 4. Verificar se os executáveis do Whisper existem
Write-Host "🔍 Verificando dependências do Whisper..." -ForegroundColor Yellow
$whisperFiles = @(
    "whisper/whisper-cli.exe",
    "whisper/whisper-server.exe", 
    "whisper/whisper-stream.exe",
    "whisper/whisper-command.exe",
    "whisper/whisper-bench.exe",
    "whisper/whisper-talk-llama.exe",
    "whisper/stream.exe",
    "whisper/command.exe",
    "whisper/bench.exe",
    "whisper/lsp.exe",
    "whisper/main.exe",
    "whisper/quantize.exe",
    "whisper/vad-speech-segments.exe",
    "whisper/test-vad.exe",
    "whisper/test-vad-full.exe",
    "whisper/wchess.exe"
)

$missingFiles = @()
foreach ($file in $whisperFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "⚠️ Arquivos do Whisper não encontrados:" -ForegroundColor Yellow
    foreach ($file in $missingFiles) {
        Write-Host "   - $file" -ForegroundColor Yellow
    }
    Write-Host "💡 Certifique-se de que os executáveis do Whisper estão na pasta 'whisper/'" -ForegroundColor Cyan
}

# 5. Verificar modelos Vosk
Write-Host "🔍 Verificando modelos Vosk..." -ForegroundColor Yellow
if (-not (Test-Path "src-tauri/models/vosk-model-small-pt-0.3")) {
    Write-Host "⚠️ Modelo Vosk não encontrado. Extraindo..." -ForegroundColor Yellow
    if (Test-Path "src-tauri/models/vosk-model-small-pt-0.3.zip") {
        Expand-Archive -Path "src-tauri/models/vosk-model-small-pt-0.3.zip" -DestinationPath "src-tauri/models/" -Force
        Write-Host "✅ Modelo Vosk extraído com sucesso" -ForegroundColor Green
    } else {
        Write-Host "❌ Arquivo do modelo Vosk não encontrado" -ForegroundColor Red
    }
}

# 6. Build do Tauri
Write-Host "🦀 Construindo aplicação Tauri..." -ForegroundColor Yellow
Set-Location "src-tauri"
cargo tauri build --bundles msi,nsis,appimage,deb,dmg

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build do Tauri" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

Set-Location ".."

# 7. Verificar se os instaladores foram criados
Write-Host "🔍 Verificando instaladores gerados..." -ForegroundColor Yellow
$installerPaths = @(
    "src-tauri/target/release/bundle/msi/*.msi",
    "src-tauri/target/release/bundle/nsis/*.exe", 
    "src-tauri/target/release/bundle/appimage/*.AppImage",
    "src-tauri/target/release/bundle/deb/*.deb",
    "src-tauri/target/release/bundle/dmg/*.dmg"
)

$createdInstallers = @()
foreach ($pattern in $installerPaths) {
    $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
    if ($files) {
        $createdInstallers += $files
    }
}

if ($createdInstallers.Count -gt 0) {
    Write-Host "✅ Instaladores criados com sucesso:" -ForegroundColor Green
    foreach ($installer in $createdInstallers) {
        $size = [math]::Round($installer.Length / 1MB, 2)
        Write-Host "   📦 $($installer.Name) ($size MB)" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️ Nenhum instalador foi criado" -ForegroundColor Yellow
}

# 8. Criar diretório de distribuição
Write-Host "📁 Organizando arquivos de distribuição..." -ForegroundColor Yellow
$distDir = "distribuicao"
if (Test-Path $distDir) {
    Remove-Item -Recurse -Force $distDir
}
New-Item -ItemType Directory -Path $distDir

# Copiar instaladores
foreach ($installer in $createdInstallers) {
    Copy-Item $installer.FullName -Destination $distDir
}

# Copiar documentação
$docs = @(
    "README.md",
    "LICENSE"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Copy-Item $doc -Destination $distDir
    }
}

# Criar arquivo de instruções de instalação
$installInstructions = @"
# CoterapIA - Instruções de Instalação

## Instaladores Disponíveis

### Windows
- **MSI**: Instalador padrão do Windows (recomendado)
- **NSIS**: Instalador alternativo com mais opções

### Linux  
- **DEB**: Para distribuições baseadas em Debian/Ubuntu
- **AppImage**: Executável portável (funciona em qualquer distribuição)

### macOS
- **DMG**: Instalador para macOS

## Dependências Incluídas

✅ Whisper (Speech-to-Text)
✅ Modelos Vosk (Reconhecimento de voz em português)
✅ Todas as bibliotecas necessárias
✅ WebView2 (Windows) / WebKit (Linux/macOS)

## Instalação

### Windows
1. Execute o arquivo .msi ou .exe
2. Siga as instruções do instalador
3. O CoterapIA será instalado com todas as dependências

### Linux
1. Para DEB: `sudo dpkg -i coterapia_*.deb`
2. Para AppImage: `chmod +x coterapia_*.AppImage && ./coterapia_*.AppImage`

### macOS
1. Abra o arquivo .dmg
2. Arraste o CoterapIA para a pasta Aplicações
3. Execute pela primeira vez (pode ser necessário permitir na Segurança)

## Primeira Execução

1. O CoterapIA configurará automaticamente todas as dependências
2. Os modelos de IA serão baixados automaticamente na primeira execução
3. Configure suas chaves de API nas configurações

## Suporte

Para suporte técnico, visite: https://www.coterapia.com.br/suporte
"@

$installInstructions | Out-File -FilePath "$distDir/INSTRUCOES_INSTALACAO.md" -Encoding UTF8

Write-Host "🎉 Build completo! Instaladores disponíveis em: $distDir" -ForegroundColor Green
Write-Host "📋 Instruções de instalação criadas em: $distDir/INSTRUCOES_INSTALACAO.md" -ForegroundColor Cyan
