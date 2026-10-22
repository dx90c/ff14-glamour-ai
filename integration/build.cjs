const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'..'),experiment=path.resolve(root,'../branch-2.6.0-a1/url-test');
let tools=fs.readFileSync(path.join(experiment,'advanced.js'),'utf8');
tools=tools.slice(tools.indexOf('function explorationSlot'),tools.indexOf('function showNameAudit'));
tools=tools.replaceAll('collectionData','resultData').replaceAll('collectionTitle','resultTitle').replaceAll('collectionBlobUrl','resultBlobUrl');
tools=tools.replace("'merge-v2-truncated'","'main261-integration-v1'");
tools=tools.replace('explorationPrefs.retryScale,getCustomDatabase()?.provenance', 'explorationPrefs.retryScale,getCustomDatabase()?.updatedAt,getCustomDatabase()?.version,getCustomDatabase()?.provenance');
tools=tools.replace('let common=0;',"if(previous.data.source_url!==result.data.source_url || previous.data.group_label!==result.data.group_label || JSON.stringify(previous.data.group_region)!==JSON.stringify(result.data.group_region))return false;\n      let common=0;");
tools=tools.replace("if(cached?.signature===explorationCacheSignature())","if(cached?.signature===explorationCacheSignature() && Date.now()-cached.savedAt<86400000)");
tools=tools.replace("if(status.textContent.startsWith('完成') && postResults.length)","if(status.textContent.startsWith('完成') && !status.textContent.includes('部分圖片未完成') && postResults.length)");
tools=tools.replace("photo:r.photo.number","photo:r.photo.number");
tools=tools.replace("const rows=await explorationStore('readonly',store=>store.getAll());","const rows=await explorationStore('readonly',store=>store.getAll());");
tools=tools.replace("if(posts.length>20)await explorationStore('readwrite',store=>posts.slice(20).forEach(r=>store.delete('post:'+r.id)));","let bytes=0;const remove=posts.filter((r,i)=>{bytes+=r.photos.reduce((n,p)=>n+(p.file?.size||0),0);return i>=20||bytes>100*1024*1024||Date.now()-r.savedAt>86400000;});if(remove.length)await explorationStore('readwrite',store=>remove.forEach(r=>store.delete('post:'+r.id)));");
// One controller owns the complete result list after a batch; the original main loader still owns each post.
tools=tools.replace("if(lines.length>1)return runPostBatch(force);", "if(lines.length)return runPostBatch(force);");
tools=tools.replace("photos:[...postPhotos]","photos:[...postPhotos],scanPhoto:result.photo");
tools=tools.replace("row.textContent=url;", "const link=document.createElement('a');link.className='batch-source';link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=url;link.title=url;row.append(link);const actions=document.createElement('div');actions.className='batch-row-actions';row.append(actions);");
tools=tools.replace('row.append(b);','actions.append(b);');
tools=tools.replace('row.append(detail);','actions.append(detail);');
tools=tools.replace("if(explorationBatchBusy){showToast('請等批次完成');return;}\n  ", '');
tools=tools.replace('for(const result of postResults){const record=',"for(const result of postResults.filter(r=>r.data.source_url===parsePostUrl(url).url)){const record=");
tools=tools.replace("document.getElementById('batchResults').append(row);", "document.getElementById('batchResults').append(row);\n      if(explorationBatchRows.length)publishPostProgress([],[]);");
tools=tools.replace('if(explorationBatchRows.length)showBatchResult(0);', 'if(explorationBatchRows.length)publishPostProgress([],[]);');
tools=tools.replace('results:postResults.map(r=>', 'results:postResults.filter(r=>parsePostUrl(r.data.source_url).id===post.id).map(r=>');
tools=tools.replace('postResults=mergePostOutfits(postResults);', 'postResults=mergePostOutfits(postResults.filter(r=>parsePostUrl(r.data.source_url).id===post.id));');
tools=tools.replace('renderPostChoices();showPostResult(0);\n      if(postResults.length<originalCount)', 'renderPostChoices();\n      if(postResults.length<originalCount)');
tools=tools.replace("try{await savePostCache(post);}catch{status.textContent+=' 結果快取未保存，仍可匯出。';}","try{await savePostCache(post);}catch{status.textContent+=' 結果快取未保存，仍可匯出。';}\n      publishPostProgress(postResults,postPhotos);");
tools=tools.replace('postPhotos=photos;postResults=results;renderPostChoices();showPostResult(0);','publishPostProgress(results,photos);');
tools=tools.replace("postResults=explorationBatchRows;postPhotos=[...new Set(explorationBatchRows.flatMap(r=>r.photos||[r.photo]))];","postResults=explorationBatchRows;postPhotos=explorationBatchRows[index]?.photos||[];");
const prelude=`let explorationBatchBusy=false,explorationBatchStop=false,explorationBatchRows=[];
const explorationPrefs={retry:true,retryScale:3};
async function explorationStore(mode,run){
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('FF14_POST_RESULTS_INTEGRATION_1',1);r.onupgradeneeded=()=>r.result.createObjectStore('data');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 try{return await new Promise((resolve,reject)=>{const tx=db.transaction('data',mode);let result;tx.oncomplete=()=>resolve(result instanceof IDBRequest?result.result:result);tx.onabort=tx.onerror=()=>reject(tx.error||new Error('本機儲存失敗'));try{result=run(tx.objectStore('data'));}catch(e){tx.abort();reject(e);}});}finally{db.close();}
}
function resultData(data){
 if(!data||!Array.isArray(data.items)||!data.items.length||data.items.length>100)throw new Error('結果資料不完整');
 const copy=structuredClone(data);delete copy.outfits;
 if(copy.source_url)copy.source_url=parsePostUrl(copy.source_url).url;
 if(copy.group_region && !(Number.isFinite(copy.group_region.min)&&Number.isFinite(copy.group_region.max)&&copy.group_region.min>=0&&copy.group_region.max<=1&&copy.group_region.max>copy.group_region.min))throw new Error('分組範圍無效');
 return copy;
}
function resultTitle(data){return data.outfit_title&&!/^(免費 OCR|【套裝】|外觀穿搭)/.test(data.outfit_title)?data.outfit_title:(data.items.find(x=>x.slot==='身體')?.name_zh||data.items[0]?.name_zh||'FF14外觀筆記');}
function resultBlobUrl(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('圖片讀取失敗'));r.readAsDataURL(blob);});}
`;
let truncated=fs.readFileSync(path.join(experiment,'truncated.js'),'utf8');
truncated=truncated.replace("if(!item.truncated_id", "if([item.name_en_jp,item.name_huiji].filter(Boolean).some(name=>{const m=matchBeforeTruncated({name_zh:name});return m&&m.id!==item.truncated_id;}))return null;\n  if(!item.truncated_id");
truncated=truncated.replace('async function scanOCRRegions(input,scale,options){','async function scanOCRRegions(input,scale,options={}){');
truncated=truncated.replace('const base=await window.FF14OCR.recognize(input,options),bitmap=await createImageBitmap(input),lines=[...base.items];',`const base=await window.FF14OCR.recognize(input,options),bitmap=await createImageBitmap(input);
  const region=options.region||{min:0,max:1},inside=l=>{const b=ocrBox(l);return b.x>=region.min*bitmap.width&&b.x+b.w<=region.max*bitmap.width;};
  base.items=base.items.filter(inside);const lines=[...base.items];`);
truncated=truncated.replace('Math.max(0,column.x-16),w=Math.min(bitmap.width-x,column.right-x+16)','Math.max(region.min*bitmap.width,column.x-16),w=Math.min(region.max*bitmap.width-x,column.right-x+16)');
truncated=truncated.replace('if(!lines.some(l=>normalizeItemName', 'if(inside(mapped)&&!lines.some(l=>Math.abs(ocrBox(l).x-b.x)<Math.max(24,b.w*.15)&&normalizeItemName');
fs.writeFileSync(path.join(__dirname,'tools.js'),prelude+tools+'\n'+truncated+'\n'+fs.readFileSync(path.join(__dirname,'controller.js'),'utf8'));
for(const filename of ['index.html','FF14外觀AI辨識小工具.html']){
 let s=cp.execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'show','bd7c00c:'+filename],{cwd:root,encoding:'utf8',maxBuffer:5e6}).replaceAll('\r\n','\n');
 const replace=(from,to)=>{if(!s.includes(from))throw new Error('Missing patch: '+from.slice(0,100));s=s.replace(from,to);};
 replace('event.preventDefault();recognizePost()','event.preventDefault();submitPostUrls()');
 replace('</style>',fs.readFileSync(path.join(__dirname,'layout.css'),'utf8')+'\n</style>');
 replace("loading.style.display='block';document.getElementById('resultSection').style.display='none';", "const background=options.quiet&&document.getElementById('resultSection').style.display==='block';\n  loading.style.display=background?'none':'block';if(!background)document.getElementById('resultSection').style.display='none';");
 replace('results.push({data:outfit,photo});}', 'results.push({data:outfit,photo});}\n      publishPostProgress(results,photos);');
 replace('postResults=results;postPhotos=photos;renderPostChoices();\n      showPostResult(results.reduce((best,r,i)=>r.data.items.length>results[best].data.items.length?i:best,0));','publishPostProgress(results,photos);');
 replace('.post-input-row input {','.post-input-row input, .post-input-row textarea {');
 replace('</style>','@media(max-width:700px){.header-top{flex-wrap:wrap}.header-title{min-width:0;max-width:100%}.header-title h1{white-space:normal;flex-wrap:wrap}.header-actions{flex-wrap:wrap;max-width:100%}}\n</style>');
 replace('讀取整篇圖片</button>','讀取貼文</button><button class="btn btn-secondary" type="button" onclick="submitPostUrls(true)">重新辨識</button>');
 replace('<input id="postUrl" type="url" required placeholder="https://x.com/作者/status/貼文編號">','<textarea id="postUrl" required rows="2" placeholder="貼上 X 貼文網址即辨識；多篇請分行"></textarea>');
 replace('<div id="postChoices"',`<div id="batchPanel" hidden><span id="batchStatus"></span><button id="batchStop" class="btn btn-secondary" disabled onclick="explorationBatchStop=true">完成本篇後停止</button><div id="batchResults"></div></div>
    <div id="batchExportBar" hidden><button id="batchExport" class="btn btn-primary" onclick="exportBatchXlsx()">匯出全部 XLSX（每套一頁）</button></div>
    <div style="margin:10px 0"><select id="rescanScale" aria-label="重掃倍率"><option value="3">3 倍</option><option value="4">4 倍</option></select><button id="rescanButton" class="btn btn-secondary" onclick="rescanEnlargedImage()">放大重掃目前這套</button><small id="rescanStatus" role="status"></small><small style="display:block;color:var(--text-muted)">小字或漏件可嘗試重掃；原圖已截掉的文字無法補回。</small></div>
    <div id="postChoices"`);
 replace('async function buildOutfitXlsx(ExcelJS, data) {','async function buildOutfitXlsx(ExcelJS, data, existingWorkbook, sheetName="衣服外觀") {');
 replace('const workbook = new ExcelJS.Workbook();','const workbook = existingWorkbook || new ExcelJS.Workbook();');
 replace("workbook.addWorksheet('衣服外觀',",'workbook.addWorksheet(sheetName,');
 replace("['slot','name_zh','name_huiji','name_en_jp','source','dye','dye_setting']","['slot','name_zh','name_huiji','name_en_jp','source','dye','dye_setting','truncated_id','truncated_original','truncated_slot']");
 replace("if(!data.source_url && !data.group_label)","if(!data.source_url && !data.group_label && !postResults.some(r=>r.data===data))");
 replace('let result=await recognize(file),language=\'default\';',"const scan=(input,opts={})=>options.scanScale?scanOCRRegions(input,options.scanScale,{...opts,region:options.region}):recognize(input,opts);\n    let result=await scan(file),language='default';");
 replace("const korean=await recognize(file,{language:'ko'});","const korean=await scan(file,{language:'ko'});");
 replace('const refined=await refineOCRLines(file,result.items,slots,reread);',`let refined=await refineOCRLines(file,result.items,slots,reread);
    if(options.region)refined=refined.filter(l=>{const b=ocrBox(l),w=result.image?.width;return w&&b.x>=options.region.min*w&&b.x+b.w<=options.region.max*w;});
    refined=inferTruncatedLayouts(refined,result.image?.width||0,slots,options.region);`);
 replace("name_zh:group.line.text", "...group.line.truncatedItem,name_zh:group.line.text");
 replace("if(data.outfits){\n        const photo={number:1,file,dataUrl:document.getElementById('previewImg').src};\n        postResults=data.outfits.map(outfit=>({data:outfit,photo}));postPhotos=[photo];renderPostChoices();showPostResult(0);\n      }else{renderResult(data);currentOutfitData=data;}","const photo={number:1,file,dataUrl:document.getElementById('previewImg').src};\n      postPhotos=[photo];postResults=(data.outfits||[data]).map(outfit=>({data:outfit,photo,scanPhoto:photo,photos:[photo]}));\n      explorationBatchRows=postResults;document.getElementById('batchPanel').hidden=true;document.getElementById('batchExportBar').hidden=postResults.length<2;showPostResult(0);");
 replace('// === [SECTION: JS_POST_IMAGES] END ===', '// === [SECTION: JS_POST_IMAGES] END ===\n'+fs.readFileSync(path.join(__dirname,'tools.js'),'utf8'));
 s=s.replaceAll('V2.6.1','V2.6.1 整合測試');
 fs.writeFileSync(path.join(root,filename),s);
}
