@echo off
echo ========================================
echo    ai-home - Starting System (Windows)
echo ========================================
echo.

echo Checking for .env file...
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please run setup.sh first using Git Bash or WSL.
    pause
    exit /b
)

echo Starting Docker services (Postgres + Home Assistant)...
docker compose up -d

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Docker failed to start.
    echo Make sure Docker Desktop is running.
    pause
    exit /b
)

echo Waiting for Postgres to be ready...
timeout /t 15 /nobreak >nul

echo.
echo Running database migrations and seeding...
cd apps\server

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Running migrations...
call npm run migration:run -w @home-ai/server

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Migrations failed.
    pause
    exit /b
)

echo Seeding initial data...
call npm run seed:run -w @home-ai/server

echo.
echo ========================================
echo SERVER STARTED SUCCESSFULLY!
echo ========================================
echo.
echo ai-home is now running at: http://localhost:3000
echo Test it here: http://localhost:3000/api/admin/health
echo.
echo Press Ctrl+C to stop the server when you're done.
echo.

call npm run dev:server

pause