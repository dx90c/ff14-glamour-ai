const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const file = process.argv[2] || 'FF14外觀AI辨識小工具.html';
const html = fs.readFileSync(file,'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements = new Map();
function element() {
  return {style:{},classList:{add(){},remove(){},contains(){return false},toggle(){}},
    addEventListener(){},setAttribute(){},removeAttribute(){},children:[],appendChild(child){this.children.push(child)},
    querySelectorAll(){return []},scrollIntoView(){},innerText:'',innerHTML:'',value:'chs',isConnected:true};
}
const context = vm.createContext({console,URLSearchParams,AbortSignal,Map,Set,Blob,structuredClone,atob,TextDecoder,Uint8Array,
  setTimeout,clearTimeout,localStorage:{getItem(){return null}},
  window:{addEventListener(){}},location:{protocol:'file:'},
  document:{addEventListener(){},querySelectorAll(){return []},getElementById(id){if(!elements.has(id)) elements.set(id,element());return elements.get(id)},createElement:element},
  fetch:async()=>{throw Error('offline')}});
vm.runInContext(script,context);
const run = code => vm.runInContext(code,context);
const csv = (name,slot='1') => 'key,0,1\n#,Name,EquipSlotCategory\nint32,str,int32\n0,"",0\n1,"'+name+'",'+slot+'\n';
context.texts = {chs:csv('测试外套'),en:csv("Test Coat"),ja:csv('テストコート'),fr:csv('Manteau test'),de:csv('Testmantel')};
run("cachedCustomDb = buildDatabase(texts,{sha:'test'}); validateDatabase(cachedCustomDb)");
assert.equal(run('Object.keys(cachedCustomDb.records).length'),1);
for (const name of ['Test Coat','test coat','テストコート','Manteau test','Testmantel','测试外套']) {
  context.item = {name_zh:'',name_en_jp:name};
  assert.equal(run('matchEquipment(item).id'),'1');
  assert.equal(run('getHuijiWikiUrl(item).label'),'🔗 灰機直達');
}
context.item = {name_zh:'测试外套',name_en_jp:'OCR typo',name_huiji:'测试外套'};
assert.equal(run('getHuijiWikiUrl(item).label'),'🔗 灰機直達');
// Duplicate names must not silently choose a different item.
run("cachedCustomDb.records['2']={names:{en:'Test Coat'}};cachedCustomDb.items['test coat'].push('2')");
assert.equal(run("matchEquipment({name_en_jp:'Test Coat'})"),null);
assert.equal(run("matchEquipment({name_en_jp:'Test Coat',name_zh:'测试外套'}).id"),'1');
assert.equal(run("matchEquipment({name_en_jp:'constructor'})"),null);
assert.equal(run("parseCsv('id,Name\\r\\n1,\"a, b\\n c\"\\r\\n2,\"a\"\"b\"')[1][1]"),'a, b\n c');
assert.equal(run("parseCsv('id,Name\\n1,\"a\"\"b\"')[1][1]"),'a"b');
assert.throws(()=>run("validateDatabase({schemaVersion:2,items:{x:['99']},records:{}})"));
context.sourceTexts = {
  DungeonDrop:'RowId,ItemId,ContentFinderConditionId\n1,1,4',
  DungeonBossDrop:'RowId,ContentFinderConditionId,FightNo,ItemId,Quantity\n1,4,1,1,1',
  DungeonBossChest:'RowId,ItemId,ContentFinderConditionId\n1,1,4',
  DungeonChest:'RowId,ContentFinderConditionId\n2,4',
  DungeonChestItem:'RowId,ItemId,ChestId\n1,1,2',
  StoreItem:'ItemId,StoreId\n1,35',FateItem:'ItemId,FateId\n1,120',
  MobDrop:'ItemId,BNpcNameId\n1,2',RetainerVentureItem:'ItemId,RetainerTaskRandomId\n1,30001'};
run("cachedCustomDb.sources=buildSources(sourceTexts,{'4':'沙斯塔夏'})");
assert.ok(run("resolveEquipmentSource({name_zh:'测试外套'}).sourceText.includes('沙斯塔夏')"));
assert.equal(run("resolveEquipmentSource({name_zh:'Unknown',source:'商城'}).isVerified"),false);
assert.ok(run("translateDyeSetting('Snow White')").includes('雪'));
run("renderResult({items:[{slot:'body',name_zh:'测试外套'}]})");
assert.throws(()=>run("renderResult({items:'bad'})"));
// Google function body remains byte-for-byte equal (ignoring line endings).
const google = h => h.replace(/\r\n/g,'\n').split('  function getGoogleHuijiUrl(')[1].split('\n  //')[0];
assert.equal(google(html),google(fs.readFileSync('old/FF14外觀AI辨識小工具v2.1.1.html','utf8')));
(async()=>{
  if(file==='index.html'){context.location.protocol='https:';await run('prepareDatabaseDirectory()');assert.equal(await run('saveDatabaseFile({})'),'資料庫已保存瀏覽器。');context.location.protocol='file:';}
  context.item={name_zh:'未收录',name_en_jp:'Unknown'};
  assert.equal(run('getHuijiWikiUrl(item).pending'),true);
  context.fetch=async()=>({ok:true,json:async()=>({query:{search:[{title:'物品:结果'}]}})});
  assert.equal((await run('precheckWiki(item)')).label,'🔍 灰機站內搜尋');
  run('wikiSearchCache.clear()');
  context.fetch=async()=>({ok:true,json:async()=>({query:{search:[]}})});
  assert.equal((await run('precheckWiki(item)')).label,'✨ 鴨鴨好手氣');
  run('wikiSearchCache.clear()');
  context.fetch=async()=>{throw Error('CORS')};
  assert.equal((await run('precheckWiki(item)')).label,'🔍 灰機站內搜尋');
  assert.equal(run('wikiSearchCache.size'),0);
  context.localStorage.getItem=()=> 'test';
  let readCount=0;
  context.FileReader=class {readAsDataURL(){readCount++;this.onload({target:{result:'data:image/png;base64,AAAA'}})}};
  let completeAI;
  context.callVisionAI=()=>new Promise(resolve=>{completeAI=resolve});
  context.file={type:'image/png'};
  const first=run('processFile(file)');
  await Promise.resolve();
  await run('processFile(file)');
  assert.equal(readCount,1);
  completeAI();await first;
  assert.equal(run('imageRequestBusy'),false);
  context.alert=()=>{};
  run('saveDatabaseToIDB=async payload=>{validateDatabase(payload);cachedCustomDb=payload;return true}');
  let written='';
  context.fakeDirectory={async getFileHandle(name){assert.equal(name,'ff14_database.json');return {async createWritable(){return {async write(value){written=value},async close(){},async abort(){}}}}}};
  run('databaseDirectory=fakeDirectory');
  assert.ok((await run('saveDatabaseFile(cachedCustomDb)')).includes('已保存'));
  assert.equal(JSON.parse(written).schemaVersion,2);
  context.fakeDirectory.getFileHandle=async()=>{throw Error('denied')};
  assert.ok((await run('saveDatabaseFile(cachedCustomDb)')).includes('JSON 寫入失敗'));
  run("prepareDatabaseDirectory=async()=>{};saveDatabaseFile=async()=> 'saved'");
  context.fetchText=async url=> {
    if(url.includes('/contents/libs/data/src/lib/json/patch-names.json')) return JSON.stringify({content:Buffer.from(JSON.stringify({1:{version:'7.5'},2:{version:'7.56'}})).toString('base64')});
    if(url.includes('/contents/package.json')) return JSON.stringify({content:Buffer.from(JSON.stringify({version:'11.4.31'})).toString('base64')});
    if(url.includes('/releases?')) return JSON.stringify([{name:'Unpack 7.56#hf2',tag_name:'v7.56-hf2'}]);
    return JSON.stringify({sha:'a'.repeat(40),commit:{message:'test',committer:{date:'2026-09-17T07:35:06Z'}}});
  };
  assert.equal((await run('repositoryVersion(ITEM_REPO)')).label,'Unpack 7.56#hf2');
  assert.equal((await run('repositoryVersion(TEAMCRAFT_REPO)')).label,'Teamcraft 11.4.31');
  assert.equal((await run('repositoryVersion(ITEM_REPO)')).gameVersion,'7.56#hf2');
  const tcVersion=await run('repositoryVersion(TEAMCRAFT_REPO)');
  assert.equal(tcVersion.gameVersion,'7.56');
  assert.equal(tcVersion.gameVersionBasis,'patch-index');
  const actualBefore=run('cachedCustomDb');
  run("downloadNameDatabase=async version=>buildDatabase(texts,version)");
  await run("syncDatabasePart(ITEM_REPO,{sha:'a'.repeat(40),label:'Unpack 7.56#hf2',date:'2026-09-17'},()=>{})");
  assert.equal(run('cachedCustomDb.provenance.find(p=>p.repo===ITEM_REPO).label'),'Unpack 7.56#hf2');
  assert.ok(run('cachedCustomDb.provenance.find(p=>p.repo===ITEM_REPO).fetchedAt'));
  assert.equal(run('cachedCustomDb.sources[1].length'),actualBefore.sources[1].length);
  context.calls=[];context.failSource=true;
  run("cachedCustomDb.provenance=[];repositoryVersion=async repo=>({sha:repo,label:repo,date:'2026-10-04'});syncDatabasePart=async(repo,version)=>{calls.push(repo);if(repo===TEAMCRAFT_REPO && failSource)throw Error('download failed');const db=structuredClone(cachedCustomDb);db.provenance=db.provenance.filter(p=>p.repo!==repo);db.provenance.push({repo,commit:version.sha,label:version.label});db.ocrSupport ||= {commits:{}};db.ocrSupport.commits ||= {};db.ocrSupport.commits[repo]=version.sha;await saveDatabaseToIDB(db);return db}");
  await run('syncAllDatabases()');
  assert.equal(context.calls.length,3);
  assert.equal(run('cachedCustomDb.provenance.length'),2);
  context.failSource=false;context.calls.length=0;
  await run('syncAllDatabases()');
  assert.deepEqual(context.calls,['ffxiv-teamcraft/ffxiv-teamcraft']);
  assert.equal(run('cachedCustomDb.provenance.length'),3);
  context.calls.length=0;await run('syncAllDatabases()');assert.equal(context.calls.length,0);
  assert.equal(run('databaseSyncBusy'),false);
  run("delete cachedCustomDb.ocrSupport.commits[ITEM_REPO]");
  context.calls.length=0;await run('syncAllDatabases()');
  assert.deepEqual(context.calls,['InfSein/ffxiv-datamining-mixed']);
  context.calls.length=0;await run('syncAllDatabases()');assert.equal(context.calls.length,0);
  context.fullDb=JSON.parse(fs.readFileSync('ff14_database.json','utf8'));
  run('cachedCustomDb=validateDatabase(fullDb)');
  run('renderDatabaseVersions()');
  assert.ok(elements.get('databaseVersionRows').innerHTML.includes('補丁索引至 7.56'));
  assert.ok(elements.get('databaseVersionRows').innerHTML.includes('https://github.com/InfSein/ffxiv-datamining-mixed'));
  const examples=[['Baronial Jacket','40427','任務獎勵'],['Edenmorn Dress Sleeves of Healing','32326','再生之章'],['Saotome Hakama','34015','職業裝備領取'],["Loyal Housemaid's Brim",'20489','商城'],["Far Eastern Schoolgirl's Boots",'24604','商城'],['No.2 Type B Boots','28713','複製工廠']];
  for(const [name,id,source] of examples){
    context.item={name_en_jp:name};
    assert.equal(run('matchEquipment(item).id'),id);
    assert.ok(run('resolveEquipmentSource(item).sourceText').includes(source),name);
    for(const value of Object.values(context.fullDb.records[id].names)){
      if(!value)continue;
      context.item={name_en_jp:value};
      assert.equal(run('matchEquipment(item).id'),id,value);
    }
  }
  assert.equal(run("matchEquipment({name_en_jp:'Baronial Jaket'}).matchType"),'fuzzy');
  assert.equal(run("matchEquipment({name_en_jp:'Edenmorn Unknown'})"),null);
  const typo=run("matchEquipment({name_zh:'維艾拉熟褲'})");
  assert.equal(typo.matchType,'fuzzy');
  assert.ok(run("matchedEquipmentExportName({name_zh:'維艾拉熟褲'},'維艾拉熟褲')").includes('疑似匹配；原辨識：維艾拉熟褲'));
  assert.ok(Object.values(typo.names).some(n=>n.includes('熱褲')));
  assert.ok(run("resolveEquipmentSource({name_zh:'維艾拉熟褲'}).sourceText").length);
  run("renderResult({items:[{slot:'legs',name_zh:'維艾拉熟褲'}]})");
  assert.ok([...elements.values()].some(e=>e.children.some(child=>child.innerHTML.includes('疑似匹配'))));
  assert.equal(run("oneCharacterDifference('abcd','abdc')"),false);
  assert.equal(run("oneCharacterDifference('abcde','abXde')"),true);
  const realDb=run('cachedCustomDb');
  run("cachedCustomDb={schemaVersion:2,records:{1:{names:{tc:'測試外套甲'}},2:{names:{tc:'測試外套乙'}}},items:{'測試外套甲':['1'],'測試外套乙':['2']},sources:{}};");
  assert.equal(run("matchEquipment({name_zh:'測試外套丙'})"),null);
  context.realDb=realDb;run('cachedCustomDb=realDb');
  assert.equal(run("comparisonName('維艾拉熱褲')"),run("comparisonName('维艾拉热裤')"));
  assert.ok(run("weightedNameDistance('维艾拉熟裤','维艾拉热裤').cost")<run("weightedNameDistance('维艾拉黑裤','维艾拉热裤').cost"));
  run("cachedCustomDb={schemaVersion:2,records:{1:{names:{chs:'维艾拉热裤'}},2:{names:{tc:'古代王國華麗精緻絲綢長外套'}},3:{names:{en:'Edenmorn Robe of Healing'}}},items:{'维艾拉热裤':['1'],'古代王國華麗精緻絲綢長外套':['2'],'edenmorn robe of healing':['3']},sources:{}};");
  assert.equal(run("matchEquipment({name_zh:'維艾拉熱褲'}).id"),'1');
  assert.equal(run("matchEquipment({name_zh:'古代王國華麗精致絲調長外套'}).id"),'2');
  assert.equal(run("matchEquipment({name_en_jp:'Edenmorn Robe of Casting'})"),null);
  assert.equal(run("matchEquipment({name_en_jp:'Edenmorn Robe of Healinx',name_zh:'完全未知'}).id"),'3');
  run('cachedCustomDb=realDb');
  assert.equal(run("matchEquipment({name_en_jp:'Baronial Jacket',name_zh:'早乙女袴'})"),null);
  assert.equal(run("resolveEquipmentSource({name_en_jp:'Unknown'}).reason"),'unmatched');
  assert.ok(!JSON.stringify(context.fullDb.sources['34015']).includes('金幣'));
  run("renderResult({items:[{slot:'body',name_en_jp:'Baronial Jacket',name_zh:'男爵外套'}]})");
  assert.ok([...elements.values()].some(e=>e.children.some(child=>child.innerHTML.includes('任務獎勵'))));
  const beforeTeamcraft=run('cachedCustomDb');
  run("repositoryVersion=async()=>{throw Error('offline')}");
  await run('syncAllDatabases()');
  assert.equal(run('cachedCustomDb'),beforeTeamcraft);
  assert.equal(run('databaseSyncBusy'),false);
  console.log('PASS: real Teamcraft snapshot, six-language exact IDs, screenshot sources, typo/prefix rejection, conflicting names, render and failed installation preservation');
  console.log('PASS: startup, 5 languages, Chinese fallback, ambiguity, CSV, import validation, sources, dyes, render, unchanged Google, wiki success/zero/error, upload guard, sync success/failure');
})().catch(err=>{console.error(err);process.exitCode=1});
