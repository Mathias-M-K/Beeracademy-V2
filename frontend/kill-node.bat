@echo off
echo Killing node to remove lock on files..

tasklist /FI "IMAGENAME eq node.exe" | findstr /I "node.exe" >nul
if errorlevel 1 (
    echo No node processes running.
    exit /b 0
)

tasklist /FI "IMAGENAME eq node.exe"
taskkill /F /T /IM node.exe
