param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
try {
    $packageRoot = Split-Path -Parent $PSScriptRoot
    Add-Type -Path (Join-Path $PSScriptRoot 'LocalServer.cs')
    $port = [FF14LocalServer]::Start($packageRoot, 48731)
    $url = 'http://127.0.0.1:' + $port + '/index.html'
    Write-Host ('FF14 Glamour v2.5.0 - ' + $url)
    Write-Host 'Keep this window open while using OCR. Close it to stop the server.'
    if (-not $NoBrowser) { Start-Process $url }
    while ($true) { Start-Sleep -Seconds 1 }
} catch {
    Write-Host ('Unable to start: ' + $_.Exception.Message)
    exit 1
} finally {
    [FF14LocalServer]::Stop()
}
