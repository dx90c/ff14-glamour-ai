const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=process.argv[2]||'ocr/models';
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
for(const [name,model] of Object.entries(manifest.models)){
 const bytes=fs.readFileSync(path.join(root,model.file));
 assert.equal(bytes.length,model.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),model.sha256);
 assert.equal(bytes.subarray(257,262).toString(),'ustar');
 assert(model.file.includes(model.sha256.slice(0,12)));console.log('PASS:',name,model.bytes);
}
