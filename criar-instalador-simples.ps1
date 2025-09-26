# Script Simplificado para Criar Instalador do CoterapIA
# Este script cria um instalador sem dependencias externas

Write-Host "=== COTERAPIA - CRIADOR DE INSTALADOR SIMPLES ===" -ForegroundColor Magenta
Write-Host "Criando instalador sem dependencias externas..." -ForegroundColor Green

# 1. Verificar pre-requisitos
Write-Host "`n1. Verificando pre-requisitos..." -ForegroundColor Yellow

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "   Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   Node.js: NAO ENCONTRADO" -ForegroundColor Red
    Write-Host "   Instale Node.js 18+ em: https://nodejs.org" -ForegroundColor Cyan
    exit 1
}

# Verificar Rust
try {
    $rustVersion = rustc --version
    Write-Host "   Rust: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "   Rust: NAO ENCONTRADO" -ForegroundColor Red
    Write-Host "   Instale Rust em: https://rustup.rs" -ForegroundColor Cyan
    exit 1
}

# 2. Verificar dependencias
Write-Host "`n2. Verificando dependencias do projeto..." -ForegroundColor Yellow
.\setup-dependencies.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nErro: Dependencias nao estao prontas" -ForegroundColor Red
    exit 1
}

# 3. Instalar dependencias Node.js
Write-Host "`n3. Instalando dependencias Node.js..." -ForegroundColor Yellow
npm install --force

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro: Falha ao instalar dependencias Node.js" -ForegroundColor Red
    exit 1
}

# 4. Build do frontend
Write-Host "`n4. Construindo frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro: Falha no build do frontend" -ForegroundColor Red
    exit 1
}

# 5. Build do Tauri (apenas executavel)
Write-Host "`n5. Construindo aplicacao Tauri..." -ForegroundColor Yellow
Write-Host "   Criando apenas o executavel..." -ForegroundColor Cyan

cd src-tauri
cargo tauri build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro: Falha no build do Tauri" -ForegroundColor Red
    cd ..
    exit 1
}

cd ..

# 6. Criar pasta de distribuicao
Write-Host "`n6. Criando pasta de distribuicao..." -ForegroundColor Yellow

$distDir = "CoterapIA-Instalador"
if (Test-Path $distDir) {
    Remove-Item -Recurse -Force $distDir
}
New-Item -ItemType Directory -Path $distDir

# 7. Copiar executavel
Write-Host "`n7. Copiando executavel..." -ForegroundColor Yellow
$exePath = "src-tauri/target/release/coterapia.exe"
if (Test-Path $exePath) {
    Copy-Item $exePath -Destination $distDir
    Write-Host "   Executavel copiado: coterapia.exe" -ForegroundColor Green
} else {
    Write-Host "   Erro: Executavel nao encontrado" -ForegroundColor Red
    exit 1
}

# 8. Copiar dependencias do Whisper
Write-Host "`n8. Copiando dependencias do Whisper..." -ForegroundColor Yellow

# Criar pasta whisper
New-Item -ItemType Directory -Path "$distDir/whisper"

# Copiar executaveis do Whisper
$whisperFiles = Get-ChildItem -Path "whisper" -Filter "*.exe"
foreach ($file in $whisperFiles) {
    Copy-Item $file.FullName -Destination "$distDir/whisper"
    Write-Host "   Copiado: $($file.Name)" -ForegroundColor Cyan
}

# Copiar DLLs do Whisper
$dllFiles = Get-ChildItem -Path "whisper" -Filter "*.dll"
foreach ($file in $dllFiles) {
    Copy-Item $file.FullName -Destination "$distDir/whisper"
    Write-Host "   Copiado: $($file.Name)" -ForegroundColor Cyan
}

# 9. Copiar modelos Vosk
Write-Host "`n9. Copiando modelos Vosk..." -ForegroundColor Yellow

# Criar pasta models
New-Item -ItemType Directory -Path "$distDir/models"

# Copiar modelo Vosk
if (Test-Path "src-tauri/models") {
    Copy-Item -Recurse "src-tauri/models" -Destination "$distDir"
    Write-Host "   Modelos Vosk copiados" -ForegroundColor Cyan
}

# 10. Copiar bibliotecas Vosk
Write-Host "`n10. Copiando bibliotecas Vosk..." -ForegroundColor Yellow

# Criar pasta vosk-libs
New-Item -ItemType Directory -Path "$distDir/vosk-libs"

# Copiar bibliotecas Vosk
if (Test-Path "src-tauri/vosk-libs") {
    Copy-Item -Recurse "src-tauri/vosk-libs" -Destination "$distDir"
    Write-Host "   Bibliotecas Vosk copiadas" -ForegroundColor Cyan
}

# 11. Criar script de instalacao
Write-Host "`n11. Criando script de instalacao..." -ForegroundColor Yellow

$installScript = @"
@echo off
echo ========================================
echo    COTERAPIA - INSTALADOR AUTOMATICO
echo ========================================
echo.
echo Este script ira instalar o CoterapIA e todas as suas dependencias.
echo.
pause

echo.
echo [1/4] Criando diretorio de instalacao...
if not exist "%ProgramFiles%\CoterapIA" mkdir "%ProgramFiles%\CoterapIA"
if not exist "%ProgramFiles%\CoterapIA\whisper" mkdir "%ProgramFiles%\CoterapIA\whisper"
if not exist "%ProgramFiles%\CoterapIA\models" mkdir "%ProgramFiles%\CoterapIA\models"
if not exist "%ProgramFiles%\CoterapIA\vosk-libs" mkdir "%ProgramFiles%\CoterapIA\vosk-libs"

echo [2/4] Copiando arquivos principais...
copy "coterapia.exe" "%ProgramFiles%\CoterapIA\"
copy "whisper\*" "%ProgramFiles%\CoterapIA\whisper\"
copy "models\*" "%ProgramFiles%\CoterapIA\models\"
copy "vosk-libs\*" "%ProgramFiles%\CoterapIA\vosk-libs\"

echo [3/4] Criando atalho na area de trabalho...
echo [InternetShortcut] > "%USERPROFILE%\Desktop\CoterapIA.url"
echo URL=file:///%ProgramFiles%/CoterapIA/coterapia.exe >> "%USERPROFILE%\Desktop\CoterapIA.url"
echo IconFile=%ProgramFiles%\CoterapIA\coterapia.exe >> "%USERPROFILE%\Desktop\CoterapIA.url"
echo IconIndex=0 >> "%USERPROFILE%\Desktop\CoterapIA.url"

echo [4/4] Configurando permissoes...
icacls "%ProgramFiles%\CoterapIA" /grant Everyone:F /T

echo.
echo ========================================
echo    INSTALACAO CONCLUIDA COM SUCESSO!
echo ========================================
echo.
echo O CoterapIA foi instalado em: %ProgramFiles%\CoterapIA
echo Um atalho foi criado na sua area de trabalho.
echo.
echo Para executar o CoterapIA, clique no atalho da area de trabalho
echo ou execute: "%ProgramFiles%\CoterapIA\coterapia.exe"
echo.
pause
"@

$installScript | Out-File -FilePath "$distDir/INSTALAR.bat" -Encoding ASCII

# 12. Criar script de desinstalacao
Write-Host "`n12. Criando script de desinstalacao..." -ForegroundColor Yellow

$uninstallScript = @"
@echo off
echo ========================================
echo    COTERAPIA - DESINSTALADOR
echo ========================================
echo.
echo Este script ira remover o CoterapIA e todos os seus arquivos.
echo.
pause

echo.
echo [1/3] Removendo atalho da area de trabalho...
if exist "%USERPROFILE%\Desktop\CoterapIA.url" del "%USERPROFILE%\Desktop\CoterapIA.url"

echo [2/3] Removendo arquivos do programa...
if exist "%ProgramFiles%\CoterapIA" rmdir /s /q "%ProgramFiles%\CoterapIA"

echo [3/3] Limpando registros...
reg delete "HKEY_CURRENT_USER\Software\CoterapIA" /f 2>nul

echo.
echo ========================================
echo    DESINSTALACAO CONCLUIDA!
echo ========================================
echo.
echo O CoterapIA foi removido do seu computador.
echo.
pause
"@

$uninstallScript | Out-File -FilePath "$distDir/DESINSTALAR.bat" -Encoding ASCII

# 13. Criar arquivo README
Write-Host "`n13. Criando documentacao..." -ForegroundColor Yellow

$readme = @"
# COTERAPIA - INSTRUCOES DE INSTALACAO

## Instalacao Automatica

1. Execute o arquivo `INSTALAR.bat` como administrador
2. Siga as instrucoes na tela
3. O CoterapIA sera instalado automaticamente com todas as dependencias

## Instalacao Manual

Se a instalacao automatica nao funcionar:

1. Copie a pasta `CoterapIA` para `C:\Program Files\`
2. Execute `coterapia.exe` para iniciar o programa
3. Crie um atalho na area de trabalho se necessario

## Desinstalacao

Execute o arquivo `DESINSTALAR.bat` como administrador para remover completamente o CoterapIA.

## Dependencias Incluidas

- Whisper (Speech-to-Text)
- Modelos Vosk (Reconhecimento de voz em portugues)
- Todas as bibliotecas necessarias

## Primeira Execucao

1. O CoterapIA configurara automaticamente todas as dependencias
2. Os modelos de IA serao baixados automaticamente na primeira execucao
3. Configure suas chaves de API nas configuracoes

## Suporte

Para suporte tecnico, visite: https://www.coterapia.com.br/suporte

## Arquivos Incluidos

- `coterapia.exe` - Executavel principal
- `whisper/` - Executaveis e bibliotecas do Whisper
- `models/` - Modelos de IA (Vosk)
- `vosk-libs/` - Bibliotecas Vosk
- `INSTALAR.bat` - Script de instalacao automatica
- `DESINSTALAR.bat` - Script de desinstalacao
- `README.md` - Este arquivo de instrucoes
"@

$readme | Out-File -FilePath "$distDir/README.md" -Encoding UTF8

# 14. Criar arquivo ZIP
Write-Host "`n14. Criando arquivo ZIP..." -ForegroundColor Yellow

$zipPath = "CoterapIA-Instalador.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

# Usar PowerShell para criar ZIP
Compress-Archive -Path "$distDir\*" -DestinationPath $zipPath

if (Test-Path $zipPath) {
    $zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
    Write-Host "   Arquivo ZIP criado: $zipPath ($zipSize MB)" -ForegroundColor Green
} else {
    Write-Host "   Erro: Falha ao criar arquivo ZIP" -ForegroundColor Red
}

# 15. Resumo final
Write-Host "`n=== INSTALADOR CRIADO COM SUCESSO ===" -ForegroundColor Magenta
Write-Host "Pasta de distribuicao: $distDir" -ForegroundColor Green
Write-Host "Arquivo ZIP: $zipPath" -ForegroundColor Green
Write-Host "Tamanho do ZIP: $zipSize MB" -ForegroundColor Cyan

Write-Host "`nPara distribuir o CoterapIA:" -ForegroundColor Yellow
Write-Host "1. Envie o arquivo '$zipPath' para o computador destino" -ForegroundColor White
Write-Host "2. Extraia o arquivo ZIP" -ForegroundColor White
Write-Host "3. Execute 'INSTALAR.bat' como administrador" -ForegroundColor White
Write-Host "4. Siga as instrucoes na tela" -ForegroundColor White

Write-Host "`n=== FIM ===" -ForegroundColor Magenta
