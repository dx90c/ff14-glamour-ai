const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const base=process.argv[2]||'http://127.0.0.1:48734',root=path.resolve(__dirname,'..'),agent=new http.Agent({keepAlive:true});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function request(resource,options={}){return new Promise((resolve,reject)=>{const req=http.request(base+resource,{agent,...options},res=>{const bytes=[];res.on('data',b=>bytes.push(b));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(bytes),reused:req.reusedSocket}));res.on('error',reject)});req.setTimeout(10000,()=>req.destroy(Error('timeout')));req.on('error',reject);req.end()})}
(async()=>{try{
 let reused=0;
 for(const file of ['/ff14_database.json','/ocr/models/manifest.json','/ff14_database.json']){const r=await request(file);assert.equal(r.status,200);assert.equal(digest(r.body),digest(fs.readFileSync(path.join(root,file))));if(r.reused)reused++;}assert(reused>=1);
 assert.equal((await request('/ff14_database.json',{method:'HEAD'})).body.length,0);
 assert.equal((await request('/ocr/%2e%2e%2f%2e%2e%2fapi_key.txt')).status,404);
 assert.equal((await request('/index.html',{headers:{host:'malicious.example'}})).status,403);
 assert.equal((await request('/index.html',{method:'POST'})).status,405);
 console.log('PASS complete JSON hashes, persistent connection reuse, HEAD and rejected path/Host/POST');
 }finally{agent.destroy()}
})().catch(e=>{console.error(e);process.exitCode=1});
