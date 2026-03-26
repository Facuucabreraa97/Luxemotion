@echo off
"C:\Program Files\Git\bin\git.exe" add .
"C:\Program Files\Git\bin\git.exe" commit -m "Security Patch & Visuals (Force)"
"C:\Program Files\Git\bin\git.exe" push origin main --force
pause
