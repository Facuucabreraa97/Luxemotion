@echo off
set GIT="C:\Program Files\Git\cmd\git.exe"

echo ==========================================
echo   MIVIDEO AI - DEPLOY FINAL (INFALIBLE)
echo ==========================================
echo.
echo Usando Git en: %GIT%
echo.

echo 1. Asegurando identidad...
%GIT% config --global user.email "facu@mivideoai.com"
%GIT% config --global user.name "Facu"

echo.
echo 2. Guardando todo...
%GIT% add .
%GIT% commit -m "Fix final deployment issues"

echo.
echo 3. Configurando destino (GitHub)...
%GIT% remote remove origin
%GIT% remote add origin https://github.com/Facuucabreraa97/Luxemotion.git
%GIT% branch -M main

echo.
echo 4. Enviando a la nube (FORCE PUSH)...
%GIT% push -u -f origin main

echo.
echo ==========================================
echo   SI VEZ ESTO, YA ESTA SUBIDO!
echo ==========================================
pause
