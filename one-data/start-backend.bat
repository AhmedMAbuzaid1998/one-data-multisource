@echo off
echo ================================
echo   One Data - Backend
echo   Spring Boot on :8080
echo ================================

echo Java version:
java -version

cd /d "%~dp0backend"
echo.
echo Starting backend... (http://localhost:8080/api/users)
echo Press CTRL+C to stop
echo.

mvn spring-boot:run
pause
