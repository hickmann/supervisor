@echo off
echo ========================================
echo    COTERAPIA - INSTALADOR AUTOMATICO
echo ========================================
echo.
echo Este script ira instalar o CoterapIA e todas as suas dependencias.
echo.
pause

echo.
echo [1/3] Criando diretorio de instalacao...
if not exist "%ProgramFiles%\CoterapIA" mkdir "%ProgramFiles%\CoterapIA"
if not exist "%ProgramFiles%\CoterapIA\whisper" mkdir "%ProgramFiles%\CoterapIA\whisper"

echo [2/3] Copiando arquivos principais...
copy "coterapia.exe" "%ProgramFiles%\CoterapIA\"
copy "whisper\*" "%ProgramFiles%\CoterapIA\whisper\"

echo [3/3] Criando atalho na area de trabalho...
echo [InternetShortcut] > "%USERPROFILE%\Desktop\CoterapIA.url"
echo URL=file:///%ProgramFiles%/CoterapIA/coterapia.exe >> "%USERPROFILE%\Desktop\CoterapIA.url"
echo IconFile=%ProgramFiles%\CoterapIA\coterapia.exe >> "%USERPROFILE%\Desktop\CoterapIA.url"
echo IconIndex=0 >> "%USERPROFILE%\Desktop\CoterapIA.url"
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
