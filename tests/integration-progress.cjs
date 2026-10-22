const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/dx90c/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5182/');await page.waitForFunction(()=>!!getCustomDatabase()?.records,{},{timeout:90000});
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQ1cAAAAASUVORK5CYII=','base64');
 await page.route('https://api.fxtwitter.com/2/status/*',route=>route.fulfill({json:{status:{author:{name:'作者'},media:{photos:[{url:'https://pbs.twimg.com/media/test-'+route.request().url().split('/').pop()+'.png'}]}}}}));
 await page.route('https://pbs.twimg.com/media/test-*.png',route=>route.fulfill({body:png,contentType:'image/png'}));
 await page.evaluate(()=>{
  loadPaddleEngine=async()=>{};refineOCRLines=async(file,lines)=>lines;
  const db=getCustomDatabase(),ids=['24602','50257','7392'];let count=0;
  window.FF14OCR={recognize:async()=>{count++;if(count>1){window.waiting=count;await new Promise(r=>window.releaseScan=r);}return {image:{width:1000},items:ids.map((id,i)=>({text:db.records[id].names.ja,score:.99,poly:[[10,10+i*100],[300,10+i*100],[300,35+i*100],[10,35+i*100]]}))};}};
  document.getElementById('postUrl').value=['901','902','903'].map(id=>'https://x.com/test/status/'+id).join('\n');submitPostUrls(true);
 });
 await page.waitForFunction(()=>window.waiting===2);
 const check=()=>page.evaluate(()=>({visible:document.getElementById('resultSection').style.display,loading:document.getElementById('loadingBox').style.display,count:postResults.length,url:currentOutfitData.source_url}));
 let state=await check();assert.equal(state.visible,'block');assert.equal(state.loading,'none');assert.equal(state.count,1);assert(state.url.endsWith('901'));
 await page.evaluate(()=>releaseScan());await page.waitForFunction(()=>window.waiting===3);state=await check();assert.equal(state.count,2);assert.equal(state.loading,'none');assert(state.url.endsWith('901'));
 await page.locator('#postChoices button').nth(1).click();assert((await check()).url.endsWith('902'));
 await page.evaluate(()=>releaseScan());await page.waitForFunction(()=>!imageRequestBusy&&!explorationBatchBusy);state=await check();assert.equal(state.count,3);assert(state.url.endsWith('902'));
 console.log('PASS slow second/third recognition keeps result visible, appends progressively and preserves user selection');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
