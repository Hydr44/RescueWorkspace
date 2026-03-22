# Script per copiare il progetto dalla condivisione di rete a una directory locale
# Esegui questo script dalla root del workspace

param(
    [string]$Destinazione = "$env:USERPROFILE\Projects\rescuemanager-workspace"
)

$Origine = $PSScriptRoot
if (-not $Origine) {
    $Origine = Get-Location
}

Write-Host "📦 Copia progetto da condivisione di rete a directory locale..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Origine: $Origine" -ForegroundColor Gray
Write-Host "Destinazione: $Destinazione" -ForegroundColor Gray
Write-Host ""

# Verifica se la destinazione esiste
if (Test-Path $Destinazione) {
    $risposta = Read-Host "La directory di destinazione esiste già. Vuoi sovrascriverla? (S/N)"
    if ($risposta -ne "S" -and $risposta -ne "s") {
        Write-Host "Operazione annullata." -ForegroundColor Yellow
        exit 0
    }
    Write-Host "Rimozione directory esistente..." -ForegroundColor Yellow
    Remove-Item -Path $Destinazione -Recurse -Force -ErrorAction SilentlyContinue
}

# Crea la directory di destinazione
New-Item -ItemType Directory -Path $Destinazione -Force | Out-Null
Write-Host "✅ Directory di destinazione creata" -ForegroundColor Green

# Cartelle e file da escludere
$Escludi = @(
    "node_modules",
    ".next",
    ".vercel",
    ".git",
    "*.log",
    ".DS_Store",
    "Thumbs.db"
)

Write-Host ""
Write-Host "📋 Copia file (esclusi node_modules, .next, ecc.)..." -ForegroundColor Cyan

# Funzione per copiare ricorsivamente escludendo certe cartelle
function Copy-ProjectFiles {
    param(
        [string]$Source,
        [string]$Destination,
        [string[]]$Exclude
    )
    
    $items = Get-ChildItem -Path $Source -Force
    
    foreach ($item in $items) {
        $shouldExclude = $false
        
        foreach ($pattern in $Exclude) {
            if ($item.Name -like $pattern -or $item.Name -eq $pattern) {
                $shouldExclude = $true
                break
            }
        }
        
        if (-not $shouldExclude) {
            $destPath = Join-Path $Destination $item.Name
            
            if ($item.PSIsContainer) {
                # È una directory
                Write-Host "  📁 Copia: $($item.Name)" -ForegroundColor Gray
                New-Item -ItemType Directory -Path $destPath -Force | Out-Null
                Copy-ProjectFiles -Source $item.FullName -Destination $destPath -Exclude $Exclude
            } else {
                # È un file
                Copy-Item -Path $item.FullName -Destination $destPath -Force
            }
        } else {
            Write-Host "  ⏭️  Salta: $($item.Name)" -ForegroundColor DarkGray
        }
    }
}

# Copia il progetto
Copy-ProjectFiles -Source $Origine -Destination $Destinazione -Exclude $Escludi

Write-Host ""
Write-Host "✅ Copia completata!" -ForegroundColor Green
Write-Host ""

# Vai alla directory website e installa dipendenze
$WebsitePath = Join-Path $Destinazione "website"

if (Test-Path $WebsitePath) {
    Write-Host "📦 Installazione dipendenze nella directory locale..." -ForegroundColor Cyan
    Push-Location $WebsitePath
    
    # Verifica Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js non trovato. Installa Node.js da https://nodejs.org/" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    # Installa dipendenze
    Write-Host "Esecuzione: npm install..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Installazione completata!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Per avviare il server:" -ForegroundColor Cyan
        Write-Host "   cd `"$WebsitePath`"" -ForegroundColor White
        Write-Host "   npm run dev" -ForegroundColor White
        Write-Host ""
        Write-Host "   Oppure usa lo script:" -ForegroundColor Cyan
        Write-Host "   cd `"$WebsitePath`"" -ForegroundColor White
        Write-Host "   .\start-dev.ps1" -ForegroundColor White
    } else {
        Write-Host "⚠️  Ci sono stati errori durante l'installazione" -ForegroundColor Yellow
    }
    
    Pop-Location
} else {
    Write-Host "⚠️  Directory website non trovata nella destinazione" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Operazione completata!" -ForegroundColor Green
Write-Host "   Progetto copiato in: $Destinazione" -ForegroundColor Gray

