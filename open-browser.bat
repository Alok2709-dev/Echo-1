@echo off
title Echo Web Assistant
cd /d "%~dp0"

echo [Echo] Launching Echo Neural Web Interface on localhost:3000...
start "" /b node -e "const http=require('http'),fs=require('fs'),path=require('path'); const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json','.mp3':'audio/mpeg','.wav':'audio/wav'}; const server=http.createServer((req,res)=>{ const cleanUrl=req.url.split('?')[0]; let filePath=path.join(__dirname, cleanUrl==='/'?'index.html':cleanUrl); if(!fs.existsSync(filePath)){ res.writeHead(404); return res.end('Not Found'); } const ext=path.extname(filePath).toLowerCase(); res.writeHead(200,{'Content-Type':(mime[ext]||'application/octet-stream')+'; charset=utf-8','Access-Control-Allow-Origin':'*'}); fs.createReadStream(filePath).pipe(res); }); server.listen(3000,()=>{ console.log('[Echo] Running at http://localhost:3000'); require('child_process').exec('start http://localhost:3000'); });"
exit /b 0
