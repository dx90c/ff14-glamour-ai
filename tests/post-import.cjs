const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.split('// === [SECTION: JS_POST_IMAGES] START ===')[1]?.split('// === [SECTION: JS_POST_IMAGES] END ===')[0];assert(source);
const ctx=vm.createContext({URL,Set,AbortSignal});vm.runInContext(source,ctx);const run=s=>vm.runInContext(s,ctx);
assert.equal(run("parsePostUrl('https://x.com/silvell/status/2112176165876269384/photo/1?s=20').url"),'https://x.com/silvell/status/2112176165876269384?s=20');
assert.equal(run("postSourceAuthor({source_url:'https://x.com/silvell/status/1'})"),'@silvell');
assert.equal(run("postSourceAuthor({source_url:'https://x.com/silvell/status/1',source_author:'ぎん❖Garuda'})"),'ぎん❖Garuda');
for(const url of ['javascript:alert(1)','https://x.com.evil.test/a/status/1','https://x.com:123/a/status/1','https://user@x.com/a/status/1']){ctx.url=url;assert.throws(()=>run('parsePostUrl(url)'));}
ctx.payload={status:{media:{photos:[{url:'https://pbs.twimg.com/media/a.jpg'},{url:'https://pbs.twimg.com/media/a.jpg'}]}}};assert.equal(run('postImageUrls(payload).length'),1);
ctx.payload={tweet:{media:{photos:[{url:'https://evil.test/image.jpg'}]}}};assert.throws(()=>run('postImageUrls(payload)'));
ctx.payload={status:{media:{photos:{bad:true}}}};assert.throws(()=>run('postImageUrls(payload)'));
console.log('PASS post URL validation/query preservation, author fallback, media validation and deduplication');
