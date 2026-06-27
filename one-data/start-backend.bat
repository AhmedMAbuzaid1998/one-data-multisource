@echo off
echo ================================
echo   One Data - Backend
echo   Spring Boot on :8080
echo ================================

set JAVA_HOME=C:\Users\Ahmed Abuzaid\AppData\Local\Programs\Eclipse Adoptium\jdk-17.0.19.10-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo Java version:
java -version

cd /d "%~dp0backend"
echo.
echo Starting backend... (http://localhost:8080/api/users)
echo Press CTRL+C to stop
echo.

mvn spring-boot:run
pause
