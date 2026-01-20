@echo off
set GIT="C:\Program Files\Git\cmd\git.exe"

echo ==========================================
echo   DEPLOY AUTOMATICO (SIN VENTANAS)
echo ==========================================
echo.

echo 1. Guardando archivos...
%GIT% add .

echo.
echo 2. Escribiendo mensaje de guardado...
%GIT% commit -m "Deployment fix"

echo.
echo 3. Enviando a GitHub...
%GIT% branch -M main
%GIT% remote add origin https://github.com/Facuucabreraa97/Luxemotion.git
%GIT% push -u origin main

echo.
echo ==========================================
echo   LISTO - REVISA QUE NO HAYA ERRORES ROJOS
echo ==========================================
pause
