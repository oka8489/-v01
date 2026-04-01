@echo off
echo サーバー起動中... http://localhost:3000
start http://localhost:3000
"C:\Users\Patch01\AppData\Local\Python\bin\python.exe" -m http.server 3000
