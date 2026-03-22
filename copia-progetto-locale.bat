@echo off
REM Script batch per copiare il progetto dalla condivisione di rete a una directory locale

set "DESTINAZIONE=%USERPROFILE%\Projects\rescuemanager-workspace"
set "ORIGINE=%~dp0"

echo 📦 Copia progetto da condivisione di rete a directory locale...
echo.
echo Origine: %ORIGINE%
echo Destinazione: %DESTINAZIONE%
echo.

REM Verifica se la destinazione esiste
if exist "%DESTINAZIONE%" (
    set /p RISPOSTA="La directory di destinazione esiste già. Vuoi sovrascriverla? (S/N): "
    if /i not "%RISPOSTA%"=="S" (
        echo Operazione annullata.
        exit /b 0
    )
    echo Rimozione directory esistente...
    rmdir /s /q "%DESTINAZIONE%" 2>nul
)

REM Crea la directory di destinazione
mkdir "%DESTINAZIONE%" 2>nul

echo.
echo 📋 Copia file (esclusi node_modules, .next, ecc.)...
echo.

REM Usa robocopy per copiare escludendo certe cartelle
robocopy "%ORIGINE%" "%DESTINAZIONE%" /E /XD node_modules .next .vercel .git /XF *.log .DS_Store Thumbs.db /NFL /NDL /NJH /NJS

if %ERRORLEVEL% LEQ 1 (
    echo.
    echo ✅ Copia completata!
    echo.
    
    REM Vai alla directory website
    set "WEBSITE_PATH=%DESTINAZIONE%\website"
    
    if exist "%WEBSITE_PATH%" (
        echo 📦 Installazione dipendenze nella directory locale...
        cd /d "%WEBSITE_PATH%"
        
        REM Verifica Node.js
        where node >nul 2>&1
        if %ERRORLEVEL% neq 0 (
            echo ❌ Node.js non trovato. Installa Node.js da https://nodejs.org/
            exit /b 1
        )
        
        node --version
        echo.
        echo Esecuzione: npm install...
        call npm install
        
        if %ERRORLEVEL% equ 0 (
            echo.
            echo ✅ Installazione completata!
            echo.
            echo 🚀 Per avviare il server:
            echo    cd "%WEBSITE_PATH%"
            echo    npm run dev
            echo.
            echo    Oppure usa lo script:
            echo    cd "%WEBSITE_PATH%"
            echo    start-dev.bat
        ) else (
            echo ⚠️  Ci sono stati errori durante l'installazione
        )
    ) else (
        echo ⚠️  Directory website non trovata nella destinazione
    )
    
    echo.
    echo ✨ Operazione completata!
    echo    Progetto copiato in: %DESTINAZIONE%
) else (
    echo ❌ Errore durante la copia
    exit /b 1
)

