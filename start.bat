@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ================================
echo PrintMaster Pro - local start
echo ================================

where node >nul 2>nul
if errorlevel 1 goto :node_missing

if not exist "node_modules" goto :install_deps
goto :ensure_env

:install_deps
echo Installing dependencies...
if exist "package-lock.json" (
  npm ci
) else (
  npm install
)
if errorlevel 1 goto :npm_failed

:ensure_env
if exist ".env" goto :run
if exist ".env.example" goto :copy_env_example
echo ADMIN_PASSWORD=admin123> ".env"
echo Created minimal .env (ADMIN_PASSWORD=admin123).
goto :run

:copy_env_example
copy /y ".env.example" ".env" >nul
echo Created .env from .env.example. You can edit it if needed.

:run
echo Starting dev server on http://localhost:3000 ...
echo (Press Ctrl+C to stop)
echo.
npm run dev

pause
exit /b 0

:node_missing
echo [ERROR] Node.js not found in PATH. Install Node.js LTS and retry.
pause
exit /b 1

:npm_failed
echo [ERROR] npm install failed.
pause
exit /b 1
