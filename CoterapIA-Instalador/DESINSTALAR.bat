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
