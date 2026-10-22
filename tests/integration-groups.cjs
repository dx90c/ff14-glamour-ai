const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/dx90c/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5182/');await page.waitForFunction(()=>!!getCustomDatabase()?.records,{},{timeout:90000});
 const raw=JSON.parse(fs.readFileSync(path.resolve(__dirname,'fixtures/two-outfits-ocr.json'),'utf8'));
 const result=await page.evaluate(async raw=>{
  const db=getCustomDatabase(),data=assembleOutfitLayouts(inferTruncatedLayouts(raw.items,raw.image.width,db.ocrSupport.slots),db.ocrSupport.slots,raw.image.width);
  const c=document.createElement('canvas');c.width=100;c.height=100;const blob=await new Promise(r=>c.toBlob(r)),photo={number:1,file:new File([blob],'two.png',{type:'image/png'}),dataUrl:c.toDataURL()};
  postPhotos=[photo];postResults=data.outfits.map(d=>({data:{...d,source_url:'https://x.com/test/status/123',source_author:'測試'},photo,scanPhoto:photo,photos:[photo]}));explorationBatchRows=postResults;showPostResult(1);
  await savePostCache(parsePostUrl('https://x.com/test/status/123'));
  const cached=await explorationStore('readonly',s=>s.get('post:123'));await restorePostCache(cached,parsePostUrl('https://x.com/test/status/123'));showPostResult(1);
  return postResults.map(r=>({ids:r.data.items.map(i=>matchEquipment(i)?.id),region:r.data.group_region,label:r.data.group_label,dyes:r.data.items.map(i=>i.dye)}));
 },raw);
 assert.deepEqual(result.map(r=>r.ids),[['24602','50257','7392','47243','28373'],['46885','32331','21251','11822','33976']]);assert.equal(result[1].label,'右側穿搭');assert(result[1].region.min>.4);
 const rescan=await page.evaluate(async()=>{
  const left=JSON.stringify(postResults[0].data),right=currentOutfitData,original=callLocalOCR;
  let options;callLocalOCR=async(file,opts)=>{options=opts;return structuredClone(right);};await rescanEnlargedImage();
  const success=JSON.stringify(postResults[0].data)===left&&currentOutfitData.group_label==='右側穿搭';
  const saved=currentOutfitData;callLocalOCR=async()=>({items:[postResults[0].data.items[0]]});await rescanEnlargedImage();
  const rolledBack=currentOutfitData===saved;callLocalOCR=original;
  return {success,region:options.region,rolledBack,unlocked:!document.getElementById('rescanButton').disabled,count:postResults.length};
 });assert(rescan.success);assert(rescan.region.min>.4);assert(rescan.rolledBack);assert(rescan.unlocked);assert.equal(rescan.count,2);
 const dedup=await page.evaluate(async()=>{
  const c=document.createElement('canvas');c.width=1000;c.height=300;const blob=await new Promise(r=>c.toBlob(r));
  const lines=[20,750].map(x=>({text:'Pure White',score:.99,poly:[[x,40],[x+140,40],[x+140,60],[x,60]]}));
  window.FF14OCR={recognize:async input=>({image:{width:1000,height:300},items:input instanceof Blob?lines:[]})};
  const both=await scanOCRRegions(blob,3),right=await scanOCRRegions(blob,4,{region:{min:.5,max:1}});
  return {both:both.items.length,right:right.items.length,x:ocrBox(right.items[0]).x};
 });assert.deepEqual(dedup,{both:2,right:1,x:750});assert.equal(errors.length,0);
 console.log('PASS main 10 exact items and dyes, cached two-group regions, right-side rescan scope, rollback and cross-column identical-text preservation');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
