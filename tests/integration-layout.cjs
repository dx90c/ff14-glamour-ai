const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('C:/Users/dx90c/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const page=await browser.newPage({viewport:{width:1400,height:1100}});await page.goto('http://127.0.0.1:5182/');await page.waitForFunction(()=>!!getCustomDatabase()?.records,{},{timeout:90000});
 await page.evaluate(()=>{
 const c=document.createElement('canvas');c.width=80;c.height=120;c.getContext('2d').fillStyle='#a3bdd0';c.getContext('2d').fillRect(10,5,60,110);const photo={number:1,file:new File([],'demo.png',{type:'image/png'}),dataUrl:c.toDataURL()};
 const names=['Queen of Hourne Bliaud','ヘシカスト・シクラス','ヴァンガード・スレイヤーアーマー','左側穿搭 · レルムローマー・ジャケット','右側穿搭 · 伊甸之晨詠咒外衣'];
 postResults=names.map((name,i)=>({photo,photos:[photo,{...photo,number:2}],data:{outfit_title:name,source_url:'https://x.com/example/status/'+(100+i)+'?s=46&t='+('a'.repeat(i*30)),source_author:'範例作者',items:[{slot:'身體',name_zh:'男爵外套',dye:'未染色'}]}}));explorationBatchRows=postResults;showPostResult(0);
 document.getElementById('batchPanel').hidden=false;document.getElementById('batchStatus').textContent='完成：處理 4 篇、0 篇未成功，共 5 套成果。';document.getElementById('batchExportBar').hidden=false;
 for(const r of postResults){const row=document.createElement('div');row.className='review-row';const link=document.createElement('a');link.className='batch-source';link.textContent=r.data.source_url;const actions=document.createElement('div');actions.className='batch-row-actions';const b=document.createElement('button');b.className='btn btn-secondary';b.textContent='開啟：'+r.data.outfit_title;actions.append(b);row.append(link,actions);document.getElementById('batchResults').append(row);}
 document.getElementById('resultSection').scrollIntoView();
 });
 const widths=await page.locator('.outfit-switch-card').evaluateAll(cards=>cards.map(c=>c.getBoundingClientRect().width));assert(Math.max(...widths)-Math.min(...widths)<1);
 await page.locator('#resultSection').screenshot({path:path.resolve(__dirname,'results/button-layout.png')});await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 console.log('PASS equal card widths with mixed title/URL lengths, selected state and mobile without horizontal overflow');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
