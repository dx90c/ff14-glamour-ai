const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const el=()=>({style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},querySelectorAll(){return[]},setAttribute(){},removeAttribute(){},appendChild(){},scrollIntoView(){}});
const ctx=vm.createContext({console,Map,Set,Blob,URLSearchParams,AbortSignal,structuredClone,atob,TextDecoder,Uint8Array,setTimeout,clearTimeout,localStorage:{getItem(){return null}},window:{addEventListener(){}},location:{protocol:'http:'},document:{addEventListener(){},querySelectorAll(){return[]},getElementById:el,createElement:el}});
vm.runInContext(script,ctx);ctx.db=JSON.parse(fs.readFileSync(require('path').join(__dirname,'../ff14_database.json'),'utf8'));vm.runInContext('cachedCustomDb=validateDatabase(db)',ctx);
const run=s=>vm.runInContext(s,ctx);
assert.equal(run("matchEquipment({name_zh:'유구한 바다'}).id"),'27367');
assert.equal(run("matchEquipment({name_zh:'유구한바다'}).id"),'27367');
assert.equal(run("matchEquipment({name_zh:'신왕국 둥근봇'}).id"),'42716');
assert.equal(run("matchEquipment({name_zh:'신왕국 둥근봇'}).matchType"),'fuzzy');
assert(run("lookupSingleOfficialDye('숫검정색')").includes('疑似染色'));
assert.equal(run("lookupSingleOfficialDye('순백색')"),'無瑕白染劑');
assert.equal(run("lookupSingleOfficialDye('완전다른색')"),null);
for(const r of Object.values(ctx.db.records).filter(r=>r.names.ko).slice(0,300))for(const name of Object.values(r.names)){ctx.item={name_zh:name};const expected=ctx.db.items[run('normalizeItemName(item.name_zh)')];if(expected.length===1)assert.equal(run('matchEquipment(item).id'),expected[0]);}
run("cachedCustomDb={schemaVersion:2,records:{1:{names:{ko:'가나다라마'}},2:{names:{ko:'가나다라바'}}},items:{'가나다라마':['1'],'가나다라바':['2']},ocrSupport:{koreanDyes:{'가나다라마':'A','가나다라바':'B'}}}");
assert.equal(run("matchEquipment({name_zh:'가나다라사'})"),null);
assert.equal(run("lookupSingleOfficialDye('가나다라사')"),null);
console.log('PASS 韓文空格／Unicode 正規化、錯字匹配、既有語言、歧義拒絕與染劑疑似標註');

(async()=>{
 const old=structuredClone(ctx.db);delete old.languages.ko;delete old.ocrSupport.koreanDyes;
 for(const record of Object.values(old.records))delete record.names.ko;
 old.sources['27367']=[{type:'test',text:'Keep existing acquisition'}];
 ctx.old=old;run('cachedCustomDb=old');ctx.fetch=async()=>({ok:true,json:async()=>ctx.db});
 run('saveDatabaseToIDB=async db=>{cachedCustomDb=validateDatabase(db)}');
 await run('loadPrebuiltDatabaseIfEmpty()');
 assert.equal(run("matchEquipment({name_zh:'유구한 바다'}).id"),'27367');
 assert.equal(run("cachedCustomDb.sources['27367'][0].text"),'Keep existing acquisition');
 assert.equal(run("lookupSingleOfficialDye('순백색')"),'無瑕白染劑');
 console.log('PASS old database migration preserves acquisition data and adds Korean indexes');
})().catch(e=>{console.error(e);process.exitCode=1});
