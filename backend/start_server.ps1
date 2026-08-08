<#
.SYNOPSIS
Start gaokao volunteer application backend service (Flask)

.DESCRIPTION
One-click start Flask backend service, automatically handle port occupation, open browser after startup.
#>

param(
    [int]$Port = 5000,
    [string]$BindAddr = "0.0.0.0"
)

# Set encoding to UTF-8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 强制使用TF-IDF离线模式（无需下载模型）
$env:FORCE_TFIDF = '1'

# Script directory
$ScriptPath = $PSScriptRoot
$AppPath = Join-Path $ScriptPath "app.py"

# Check if app.py exists
if (-not (Test-Path $AppPath)) {
    Write-Host "Error: app.py not found" -ForegroundColor Red
    Write-Host "Please run this script in the backend directory" -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    exit 1
}

# Find Python path
Write-Host "Looking for Python environment..." -ForegroundColor Cyan
$PythonPath = $null

# Try from system path
foreach ($py in @("python", "python3", "py")) {
    try {
        $result = & $py --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $PythonPath = $py
            Write-Host "Found Python: $py $result" -ForegroundColor Green
            break
        }
    } catch {
        continue
    }
}

# Try common paths if not found
if (-not $PythonPath) {
    $commonPaths = @(
        "C:\Python311\python.exe",
        "C:\Python310\python.exe",
        "C:\Python39\python.exe",
        "C:\Program Files\Python311\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe"
    )
    
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $PythonPath = $path
            Write-Host "Found Python: $path" -ForegroundColor Green
            break
        }
    }
}

if (-not $PythonPath) {
    Write-Host "Error: Python environment not found, please install Python first" -ForegroundColor Red
    Start-Sleep -Seconds 5
    exit 1
}

# Check if port is occupied
Write-Host "`nChecking if port $Port is occupied..." -ForegroundColor Cyan
$portUsed = $false
try {
    $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $Port)
    $listener.Start()
    $listener.Stop()
    Write-Host "Port $Port is available" -ForegroundColor Green
} catch {
    $portUsed = $true
    Write-Host "Port $Port is occupied, releasing..." -ForegroundColor Yellow
    
    # Find process occupying the port
    $processId = (Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
    if ($processId) {
        foreach ($pid in $processId) {
            try {
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "Stopping process: $($process.ProcessName) (PID: $pid)" -ForegroundColor Yellow
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    Start-Sleep -Seconds 1
                }
            } catch {
                Write-Host "Cannot stop process $pid" -ForegroundColor Red
            }
        }
    }
    
    # Check again
    try {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        Write-Host "Port $Port released" -ForegroundColor Green
    } catch {
        Write-Host "Warning: Port $Port still occupied, service may fail to start" -ForegroundColor Red
    }
}

# Check and install dependencies
Write-Host "`nChecking dependencies..." -ForegroundColor Cyan
$requirementsPath = Join-Path $ScriptPath "requirements.txt"
if (Test-Path $requirementsPath) {
    try {
        Write-Host "Installing dependencies..." -ForegroundColor Cyan
        & $PythonPath -m pip install -r $requirementsPath -q
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Dependencies installed successfully" -ForegroundColor Green
        } else {
            Write-Host "Dependency installation may have issues, continuing..." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Dependency installation failed, continuing..." -ForegroundColor Yellow
    }
}

# Initialize database
Write-Host "`nInitializing database..." -ForegroundColor Cyan
$initDbPath = Join-Path $ScriptPath "init_db.py"
if (Test-Path $initDbPath) {
    try {
        & $PythonPath $initDbPath
        Write-Host "Database initialized successfully" -ForegroundColor Green
    } catch {
        Write-Host "Database initialization may have issues, continuing..." -ForegroundColor Yellow
    }
}

# Initialize RAG vector database
Write-Host "`nInitializing RAG vector database..." -ForegroundColor Cyan
$ingestDocsPath = Join-Path $ScriptPath "ingest_docs.py"
if (Test-Path $ingestDocsPath) {
    try {
        & $PythonPath $ingestDocsPath
        Write-Host "RAG vector database initialized successfully" -ForegroundColor Green
    } catch {
        Write-Host "RAG initialization may have issues, continuing with mock data..." -ForegroundColor Yellow
    }
}

# Start Flask service
Write-Host "`nStarting Flask backend service..." -ForegroundColor Cyan
Write-Host "Service address: http://localhost:$Port" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the service" -ForegroundColor Yellow
Write-Host ""

# Start Flask service directly using python app.py
$process = Start-Process -FilePath $PythonPath -ArgumentList "app.py" -WorkingDirectory $ScriptPath -PassThru -NoNewWindow

# Wait for service to start
Start-Sleep -Seconds 3

# Check if service started successfully
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port/api/provinces" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "`nService started successfully!" -ForegroundColor Green
        Write-Host "API test passed" -ForegroundColor Green
        
        # Auto open browser
        Write-Host "Opening browser..." -ForegroundColor Cyan
        Start-Process "http://localhost:$Port/api/provinces"
        
        # Ask if user wants to run full API test
        Write-Host "`nWould you like to run the full API test suite?" -ForegroundColor Cyan
        Write-Host "This will test all API endpoints including RAG functionality." -ForegroundColor Yellow
        Write-Host "Press Y to run test, or any other key to skip..." -ForegroundColor Yellow
        $key = $host.ui.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        if ($key.Key -eq 'Y') {
            Write-Host "`nRunning API test suite..." -ForegroundColor Cyan
            & $PythonPath test_api.py
        }
    } else {
        Write-Host "Service may not have started properly" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Service may still be starting or failed to start" -ForegroundColor Yellow
}

# Keep window open
Write-Host "`nService is running..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the service" -ForegroundColor Yellow

# Monitor process, keep window open
while ($process.HasExited -eq $false) {
    Start-Sleep -Seconds 1
}

Write-Host "`nService stopped" -ForegroundColor Cyan
