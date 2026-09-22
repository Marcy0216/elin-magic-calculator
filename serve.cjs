const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'dist');
http.createServer((req,res)=>{const names={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/engine.js':'engine.js','/data.js':'data.js','/traits.js':'traits.js'};const file=names[req.url.split('?')[0]];if(!file){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8');fs.createReadStream(path.join(root,file)).pipe(res);}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));

