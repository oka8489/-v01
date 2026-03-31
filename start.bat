@echo off
echo サーバー起動中... http://localhost:3000
start http://localhost:3000
python -m http.server 3000
