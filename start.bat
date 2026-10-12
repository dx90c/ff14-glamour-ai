@echo off
setlocal DisableDelayedExpansion
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0server\start.ps1" %*
if errorlevel 1 pause
endlocal
