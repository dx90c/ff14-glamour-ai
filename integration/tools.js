let explorationBatchBusy=false,explorationBatchStop=false,explorationBatchRows=[];
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
function explorationSlot(category){return ({1:'主手',2:'副手',3:'頭部',4:'身體',5:'手部',6:'腰部',7:'腿部',8:'腳部',9:'耳飾',10:'項鍊',11:'手環',12:'戒指',13:'主手',14:'主手',15:'身體',16:'身體',18:'腿部',19:'身體',20:'身體',21:'身體',22:'身體',23:'身體'})[category]||'';}
function explicitDye(item){const raw=item.dye||item.dye_setting;if(!raw)return '';const s=translateDyeSetting(raw);return !s||s.includes('未辨識')?'':s.replace(/（疑似染色[^）]*）/g,'').replace(/[①②\s]/g,'');}
function mergePostOutfits(results){
  const merged=[];
  for(const result of results){
    const identity=item=>matchEquipment(item)?.id || normalizeItemName(item.name_zh||item.name_en_jp);
    const candidate=merged.find(previous=>{
      if(previous.data.source_url!==result.data.source_url || previous.data.group_label!==result.data.group_label || JSON.stringify(previous.data.group_region)!==JSON.stringify(result.data.group_region))return false;
      let common=0;
      for(const item of result.data.items){const other=previous.data.items.find(x=>x.slot===item.slot);if(!other)continue;if(identity(other)!==identity(item))return false;if(explicitDye(other)&&explicitDye(item)&&explicitDye(other)!==explicitDye(item))return false;common++;}
      return common>=2 && common>=Math.min(result.data.items.length,previous.data.items.length)*0.5;
    });
    if(!candidate){merged.push({...result,data:structuredClone(result.data)});continue;}
    for(const item of result.data.items){const old=candidate.data.items.find(x=>x.slot===item.slot&&identity(x)===identity(item));if(!old)candidate.data.items.push(structuredClone(item));else if(!explicitDye(old)&&explicitDye(item)){old.dye=item.dye;old.dye_setting=item.dye_setting;}}
    candidate.data.note=[...new Set([candidate.data.note,result.data.note].filter(Boolean))].join(' ');
  }return merged;
}
function explorationCacheSignature(){return JSON.stringify(['main261-integration-v1',explorationPrefs.retry,explorationPrefs.retryScale,getCustomDatabase()?.updatedAt,getCustomDatabase()?.version,getCustomDatabase()?.provenance?.map(p=>[p.repo,p.commit])]);}
async function savePostCache(post){
  const row={id:post.id,savedAt:Date.now(),signature:explorationCacheSignature(),photos:postPhotos.map(p=>({number:p.number,file:p.file})),results:postResults.filter(r=>parsePostUrl(r.data.source_url).id===post.id).map(r=>({data:resultData(r.data),photo:r.photo.number}))};
  // shortcut: keep only 20 cached posts; exports are the durable user-controlled copy.
  await explorationStore('readwrite',store=>{store.put(row,'post:'+post.id);});
  const rows=await explorationStore('readonly',store=>store.getAll());
  const posts=rows.filter(r=>r?.signature&&r.savedAt).sort((a,b)=>b.savedAt-a.savedAt);
  let bytes=0;const remove=posts.filter((r,i)=>{bytes+=r.photos.reduce((n,p)=>n+(p.file?.size||0),0);return i>=20||bytes>100*1024*1024||Date.now()-r.savedAt>86400000;});if(remove.length)await explorationStore('readwrite',store=>remove.forEach(r=>store.delete('post:'+r.id)));
}
async function restorePostCache(row,post){
  const photos=[];for(const p of row.photos)photos.push({...p,dataUrl:await resultBlobUrl(p.file)});
  const results=row.results.map(r=>({data:{...resultData(r.data),source_url:post.url},photo:photos.find(p=>p.number===r.photo)}));
  if(!results.length||results.some(r=>!r.photo))throw new Error('快取不完整');
  publishPostProgress(results,photos);
  document.getElementById('postStatus').textContent=`完成：使用本機結果快取（${new Date(row.savedAt).toLocaleString()}），${results.length} 套成果。需要更新可按「重新辨識」。`;
}
const recognizePostBeforeExploration=recognizePost;
recognizePost=async function(options={}){
  if(imageRequestBusy || (explorationBatchBusy&&!options.batch)){showToast('正在處理，請稍候');return;}
  const button=document.getElementById('postReadButton'),status=document.getElementById('postStatus');imageRequestBusy=true;button.disabled=true;
  try{
    const post=parsePostUrl(document.getElementById('postUrl').value);
    if(!options.force){try{const cached=await explorationStore('readonly',store=>store.get('post:'+post.id));if(cached?.signature===explorationCacheSignature() && Date.now()-cached.savedAt<86400000){await restorePostCache(cached,post);return;}}catch{status.textContent='本機快取不可用，改為重新讀取貼文…';}}
    imageRequestBusy=false;await recognizePostBeforeExploration();
    if(status.textContent.startsWith('完成') && !status.textContent.includes('部分圖片未完成') && postResults.length){
      const originalCount=postResults.length;postResults=mergePostOutfits(postResults.filter(r=>parsePostUrl(r.data.source_url).id===post.id));renderPostChoices();
      if(postResults.length<originalCount)status.textContent+=` 已將 ${originalCount} 張說明整合成 ${postResults.length} 套。`;
      try{await savePostCache(post);}catch{status.textContent+=' 結果快取未保存，仍可匯出。';}
      publishPostProgress(postResults,postPhotos);
    }
  }catch(e){status.textContent=e.message;}finally{imageRequestBusy=false;button.disabled=explorationBatchBusy;}
};
async function submitPostUrls(force=false){
  if(imageRequestBusy||explorationBatchBusy){showToast('正在處理，請稍候');return;}
  const lines=document.getElementById('postUrl').value.trim().split(/\r?\n/).filter(s=>s.trim());
  if(lines.length>20){document.getElementById('postStatus').textContent='每次最多 20 篇貼文';return;}
  if(lines.length)return runPostBatch(force);
  document.getElementById('batchPanel').hidden=true;document.getElementById('batchExportBar').hidden=true;
  return recognizePost({force});
}
function showBatchResult(index){
  postResults=explorationBatchRows;postPhotos=explorationBatchRows[index]?.photos||[];
  renderPostChoices();showPostResult(index);
}
async function runPostBatch(force=false){
  if(explorationBatchBusy||imageRequestBusy)return;
  document.getElementById('batchPanel').hidden=false;
  const status=document.getElementById('batchStatus');let urls;
  try{const unique=new Map();for(const line of document.getElementById('postUrl').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)){const post=parsePostUrl(line);unique.set(post.id,post.url);}urls=[...unique.values()];if(!urls.length||urls.length>20)throw new Error('請輸入 1～20 篇有效貼文網址');}catch(e){status.textContent=e.message;return;}
  const originalInput=document.getElementById('postUrl').value;document.getElementById('batchPanel').hidden=false;document.getElementById('postUrl').disabled=true;
  explorationBatchBusy=true;explorationBatchStop=false;explorationBatchRows=[];document.getElementById('batchExportBar').hidden=true;document.getElementById('batchResults').replaceChildren();document.getElementById('postReadButton').disabled=true;document.getElementById('batchStop').disabled=false;document.getElementById('batchExport').disabled=true;
  let done=0,failed=0,queueSaved=true;const failures=[];
  const saveQueue=()=>explorationStore('readwrite',s=>s.put({urls,done,failures,updatedAt:Date.now()},'batch-queue')).then(()=>{queueSaved=true;}).catch(()=>{queueSaved=false;});
  try{
    await saveQueue();
    for(const url of urls){
      if(explorationBatchStop)break;status.textContent=`處理 ${done+1}／${urls.length} 篇…`;document.getElementById('postUrl').value=url;
      await recognizePost({batch:true,force});done++;
      const ok=document.getElementById('postStatus').textContent.startsWith('完成');
      const row=document.createElement('div');row.className='review-row';const link=document.createElement('a');link.className='batch-source';link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=url;link.title=url;row.append(link);const actions=document.createElement('div');actions.className='batch-row-actions';row.append(actions);
      if(ok){for(const result of postResults.filter(r=>r.data.source_url===parsePostUrl(url).url)){const record={data:structuredClone(result.data),photo:result.photo,photos:[...postPhotos],scanPhoto:result.photo};const recordIndex=explorationBatchRows.length;explorationBatchRows.push(record);const b=document.createElement('button');b.className='btn btn-secondary';b.textContent=`開啟：${resultTitle(record.data)}`;b.onclick=()=>{showBatchResult(recordIndex);document.getElementById('resultSection')?.scrollIntoView({behavior:'smooth'});};actions.append(b);}}
      else{failed++;failures.push(url);const detail=document.createElement('small');detail.textContent=document.getElementById('postStatus').textContent;actions.append(detail);}
      document.getElementById('batchResults').append(row);
      if(explorationBatchRows.length)publishPostProgress([],[]);
      await saveQueue();
    }
  }finally{document.getElementById('postUrl').value=originalInput;document.getElementById('postUrl').disabled=false;explorationBatchBusy=false;document.getElementById('postReadButton').disabled=false;document.getElementById('batchStop').disabled=true;document.getElementById('batchExport').disabled=!explorationBatchRows.length;document.getElementById('batchExportBar').hidden=!explorationBatchRows.length;if(explorationBatchRows.length)publishPostProgress([],[]);status.textContent=`${explorationBatchStop?'已停止':'完成'}：處理 ${done} 篇、${failed} 篇未成功，共 ${explorationBatchRows.length} 套成果。${queueSaved?'':' 未能保存續跑佇列。'}`;}
}
async function restorePendingBatch(){
  if(explorationBatchBusy||imageRequestBusy)return;
  document.getElementById('batchPanel').hidden=false;
  try{const queue=await explorationStore('readonly',s=>s.get('batch-queue'));const urls=queue?[...new Set([...(queue.failures||[]),...queue.urls.slice(queue.done)])]:[];document.getElementById('postUrl').value=urls.join('\n');document.getElementById('batchStatus').textContent=urls.length?`已載入 ${urls.length} 篇，可按「讀取貼文」繼續`:'沒有已保存的未完成貼文';}catch(e){document.getElementById('batchStatus').textContent='佇列讀取失敗：'+e.message;}
}
async function explorationExcel(){
  if(window.ExcelJS)return window.ExcelJS;
  excelJsLoad ||= new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='./xlsx/exceljs.min.js';s.onload=resolve;s.onerror=()=>{s.remove();excelJsLoad=null;reject(new Error('XLSX 元件載入失敗'));};document.head.append(s);});await excelJsLoad;return window.ExcelJS;
}
async function exportBatchXlsx(){
  if(explorationBatchBusy||!explorationBatchRows.length)return;const button=document.getElementById('batchExport');button.disabled=true;
  try{
    const ExcelJS=await explorationExcel(),workbook=new ExcelJS.Workbook(),index=workbook.addWorksheet('目錄');
    index.columns=[{header:'套裝',key:'title',width:45},{header:'來源作者',key:'author',width:28},{header:'貼文來源',key:'url',width:75}];
    for(let i=0;i<explorationBatchRows.length;i++){
      const {data,photo}=explorationBatchRows[i],image=new Image();image.src=photo.dataUrl;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;canvas.getContext('2d').drawImage(image,0,0);
      const rows=data.items.map(it=>{const source=resolveEquipmentSource(it);return {slot:it.slot,name:matchedEquipmentExportName(it,it.resolved_name||it.name_zh),original:it.name_en_jp||'',source:source.sourceText,dye:translateDyeSetting(it.dye||it.dye_setting||''),wiki:getHuijiWikiUrl(it).url,google:getGoogleHuijiUrl(it)};});
      const title=resultTitle(data),sheetName=`${i+1} ${title}`.replace(/[\\/*?:\[\]]/g,'_').slice(0,31);await buildOutfitXlsx(ExcelJS,{title,rows,note:data.note,source_url:data.source_url,source_author:data.source_author,image:{dataUrl:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height}},workbook,sheetName);
      index.addRow({title:{text:title,hyperlink:`#'${sheetName.replaceAll("'","''")}'!A2`},author:data.source_author||'',url:data.source_url?{text:data.source_url,hyperlink:data.source_url}:''});
    }
    downloadBlob(new Blob([await workbook.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),outfitFileName('FF14批次外觀筆記',''));showToast('已匯出整本含圖 XLSX');
  }catch(e){alert('批次匯出失敗：'+e.message);}finally{button.disabled=false;}
}

// === [SECTION: JS_TRUNCATED_LABELS] START ===
let truncatedDb,truncatedCache=new Map();
function truncatedCandidates(text,slot=''){
  const db=getCustomDatabase(),prefix=normalizeItemName(text);
  if(!db?.ocrSupport?.slots||prefix.length<10||!/[\u3040-\u30ff]/.test(prefix))return [];
  if(truncatedDb!==db){truncatedDb=db;truncatedCache=new Map();}
  const key=prefix+'|'+slot;if(truncatedCache.has(key))return truncatedCache.get(key);
  const found=[];
  for(const [id,record] of Object.entries(db.records)){
    if(slot&&explorationSlot(db.ocrSupport.slots[id])!==slot)continue;
    const name=normalizeItemName(record.names.ja);
    if(!name||name.length<prefix.length+2||prefix.length/name.length<.5||name.slice(0,6)!==prefix.slice(0,6))continue;
    if([prefix.length-1,prefix.length,prefix.length+1].some(n=>weightedNameDistance(prefix,name.slice(0,n),1)))found.push(id);
  }
  if(truncatedCache.size>200)truncatedCache.clear();truncatedCache.set(key,found);return found;
}
const matchBeforeTruncated=matchEquipment;
matchEquipment=function(item){
  const normal=matchBeforeTruncated(item);if(normal)return normal;
  if([item.name_en_jp,item.name_huiji].filter(Boolean).some(name=>{const m=matchBeforeTruncated({name_zh:name});return m&&m.id!==item.truncated_id;}))return null;
  if(!item.truncated_id||item.truncated_original!==item.name_zh||item.truncated_slot!==item.slot)return null;
  const ids=truncatedCandidates(item.name_zh,item.slot);
  if(ids.length!==1||ids[0]!==item.truncated_id)return null;
  return {id:ids[0],names:getCustomDatabase().records[ids[0]].names,matchType:'fuzzy',original:item.name_zh,matchBasis:'截斷名稱＋部位推測'};
};
const gearBeforeTruncated=ocrGear;
ocrGear=(line,slots)=>line.truncatedItem?matchEquipment(line.truncatedItem):gearBeforeTruncated(line,slots);
function inferTruncatedLines(lines,width){
  // Only the complete, regularly spaced six-row weapon/head/body/hands/legs/feet layout has positional evidence.
  const expected=['主手','頭部','身體','手部','腿部','腳部'];
  const anchors=lines.filter(l=>gearBeforeTruncated(l,getCustomDatabase().ocrSupport.slots)?.matchType==='exact');
  const weapon=anchors.find(l=>explorationSlot(getCustomDatabase().ocrSupport.slots[gearBeforeTruncated(l,getCustomDatabase().ocrSupport.slots).id])==='主手');
  if(!weapon)return lines;
  const start=ocrBox(weapon);
  const rows=lines.filter(l=>{const b=ocrBox(l);return l.score>=.65&&!ocrDye(l)&&Math.abs(b.x-start.x)<Math.max(24,width*.04)&&(gearBeforeTruncated(l,getCustomDatabase().ocrSupport.slots)||b.x+b.w>=width*.95&&truncatedCandidates(l.text).length);}).sort((a,b)=>ocrBox(a).y-ocrBox(b).y);
  if(rows.length!==6)return lines;
  const gaps=rows.slice(1).map((l,i)=>ocrBox(l).y-ocrBox(rows[i]).y),middle=[...gaps].sort((a,b)=>a-b)[2];
  if(middle<start.h*3||gaps.some(g=>Math.abs(g-middle)>middle*.3))return lines;
  if(![0,3,5].every(i=>{const m=gearBeforeTruncated(rows[i],getCustomDatabase().ocrSupport.slots);return m?.matchType==='exact'&&explorationSlot(getCustomDatabase().ocrSupport.slots[m.id])===expected[i];}))return lines;
  if(rows.some((l,i)=>{const m=gearBeforeTruncated(l,getCustomDatabase().ocrSupport.slots);return m&&explorationSlot(getCustomDatabase().ocrSupport.slots[m.id])!==expected[i];}))return lines;
  return lines.map(l=>{const i=rows.indexOf(l);if(i<0||gearBeforeTruncated(l,getCustomDatabase().ocrSupport.slots))return l;const ids=truncatedCandidates(l.text,expected[i]);return ids.length===1?{...l,truncatedItem:{slot:expected[i],name_zh:l.text,truncated_id:ids[0],truncated_original:l.text,truncated_slot:expected[i]}}:l;});
}
// === [SECTION: JS_TRUNCATED_LABELS] END ===

async function scanOCRRegions(input,scale,options={}){
  const base=await window.FF14OCR.recognize(input,options),bitmap=await createImageBitmap(input);
  const region=options.region||{min:0,max:1},inside=l=>{const b=ocrBox(l);return b.x>=region.min*bitmap.width&&b.x+b.w<=region.max*bitmap.width;};
  base.items=base.items.filter(inside);const lines=[...base.items];
  try{
    const boxes=base.items.filter(l=>/[\p{L}]/u.test(l.text)).map(ocrBox).filter(b=>b.w>b.h&&b.h>0);
    const columns=[];
    for(const b of boxes){let column=columns.find(c=>Math.abs(c.x-b.x)<Math.max(35,bitmap.width*.06));if(!column){column={x:b.x,right:b.x+b.w,top:b.y,bottom:b.y+b.h};columns.push(column);}else{column.x=Math.min(column.x,b.x);column.right=Math.max(column.right,b.x+b.w);column.top=Math.min(column.top,b.y);column.bottom=Math.max(column.bottom,b.y+b.h);}}
    let count=0;
    for(const column of columns.slice(0,4)){
      const x=Math.max(region.min*bitmap.width,column.x-16),w=Math.min(region.max*bitmap.width-x,column.right-x+16),height=Math.min(480,Math.max(160,960/scale));
      for(let y=Math.max(0,column.top-16);y<column.bottom&&count<24;y+=height-60){
        count++;const h=Math.min(height,bitmap.height-y),c=document.createElement('canvas');c.width=Math.ceil(w*scale);c.height=Math.ceil(h*scale);
        if(c.width*c.height>12000000)continue;
        c.getContext('2d').drawImage(bitmap,x,y,w,h,0,0,c.width,c.height);
        try{const result=await window.FF14OCR.recognize(c,options);for(const line of result.items){const mapped={...line,poly:line.poly.map(p=>[x+p[0]/scale,y+p[1]/scale])},b=ocrBox(mapped);if(inside(mapped)&&!lines.some(l=>Math.abs(ocrBox(l).x-b.x)<Math.max(24,b.w*.15)&&normalizeItemName(l.text)===normalizeItemName(mapped.text)&&Math.abs(ocrBox(l).y-b.y)<Math.max(b.h,ocrBox(l).h)))lines.push(mapped);}}catch(error){console.warn('分區重掃失敗，保留原辨識',error);}
      }
    }
    // Prefer one label per physical line so rereads cannot turn six equipment rows into twelve.
    const groups=[];for(const line of lines){const b=ocrBox(line),group=groups.find(g=>{const q=ocrBox(g[0]);return Math.abs(q.y-b.y)<Math.min(q.h,b.h)*.6&&Math.abs(q.x-b.x)<Math.max(24,b.w*.15);});if(group)group.push(line);else groups.push([line]);}
    return {...base,items:groups.map(group=>group.sort((a,b)=>{const slots=getCustomDatabase().ocrSupport.slots,am=gearBeforeTruncated(a,slots),bm=gearBeforeTruncated(b,slots);return Number(!!bm)-Number(!!am)||b.text.length-a.text.length||b.score-a.score;})[0])};
  }finally{bitmap.close();}
}

// Session results are shared by the switcher and batch export; photos stay scoped to their post.
let activeResultIndex=0;
function publishPostProgress(results,photos){
 const selected=currentOutfitData;
 const pending=results.map(r=>({...r,photos:[...photos],scanPhoto:r.scanPhoto||r.photo}));
 const replacing=new Set(pending.map(r=>r.data.source_url).filter(Boolean));
 postResults=[...explorationBatchRows.filter(r=>!replacing.has(r.data.source_url)),...pending];
 if(!postResults.length)return;
 const index=postResults.findIndex(r=>r.data===selected||(r.data.source_url===selected?.source_url&&r.data.group_label===selected?.group_label&&r.photo===postResults[activeResultIndex]?.photo));
 showPostResult(index>=0?index:0);
 document.getElementById('loadingBox').style.display='none';
}
function inferTruncatedLayouts(lines,width,slots,region){
 const regions=region?[region]:detectOutfitColumns(lines,slots,width);
 if(!regions?.length)return inferTruncatedLines(lines,width);
 const inferred=new Map();
 for(const r of regions){const offset=r.min*width,subset=lines.filter(l=>{const b=ocrBox(l);return b.x>=offset&&b.x+b.w<=r.max*width;});
  const shifted=subset.map(l=>({...l,poly:l.poly.map(([x,y])=>[x-offset,y])}));
  inferTruncatedLines(shifted,(r.max-r.min)*width).forEach((l,i)=>{if(l.truncatedItem)inferred.set(subset[i],l.truncatedItem);});
 }
 return lines.map(l=>inferred.has(l)?{...l,truncatedItem:inferred.get(l)}:l);
}
const processBeforeIntegration=processFile;
processFile=function(file){if(explorationBatchBusy){showToast('批次處理中，請稍候');return;}return processBeforeIntegration(file);};
showPostResult=function(index){
 const result=postResults[index];if(!result)return;
 activeResultIndex=index;postPhotos=result.photos||postPhotos;
 currentOutfitData=result.data;setPostPreview(result.photo);renderResult(result.data);renderPostChoices();
};
renderPostChoices=function(){
 const choices=document.getElementById('postChoices');choices.replaceChildren();
 const cards=document.createElement('div');cards.className='outfit-switch-grid';choices.append(cards);
 if(postResults.length>1)postResults.forEach((result,index)=>{
  const button=document.createElement('button');button.className='outfit-switch-card';button.type='button';button.setAttribute('aria-pressed',String(index===activeResultIndex));
  const image=document.createElement('img');image.src=result.photo.dataUrl;image.alt='';
  const text=document.createElement('span');text.className='outfit-switch-text';const title=document.createElement('strong');title.textContent=`${index+1} · ${resultTitle(result.data)}`;button.title=title.textContent;
  const detail=document.createElement('small');detail.textContent=[result.data.group_label,`${result.data.items.length} 件`,result.data.source_author].filter(Boolean).join(' · ');text.append(title,detail);
  button.append(image,text);button.onclick=()=>showPostResult(index);cards.append(button);
 });
 const current=postResults[activeResultIndex],photos=current?.photos||postPhotos;
 if(photos.length>1){const heading=document.createElement('div');heading.className='photo-choice-label';heading.textContent='同篇圖片 · 選擇預覽與匯出用圖';choices.append(heading);const gallery=document.createElement('div');gallery.className='photo-choice-gallery';
  for(const photo of photos){const button=document.createElement('button');button.type='button';button.title='使用此圖作為目前這套的預覽及匯出圖片';
   button.setAttribute('aria-pressed',String(current?.photo===photo));const image=document.createElement('img');image.src=photo.dataUrl;image.alt=`貼文圖片 ${photo.number}`;button.append(image);
   button.onclick=()=>{if(current)current.photo=photo;setPostPreview(photo);renderPostChoices();};gallery.append(button);
  }choices.append(gallery);
 }
};
async function rescanEnlargedImage(){
 if(imageRequestBusy||explorationBatchBusy){showToast('正在處理，請稍候');return;}
 const previous=currentOutfitData,record=postResults.find(r=>r.data===previous),preview=document.getElementById('previewImg');
 if(!previous||!preview.getAttribute('src')){showToast('請先加入圖片');return;}
 const scale=Number(document.getElementById('rescanScale').value);if(![3,4].includes(scale))return;
 const button=document.getElementById('rescanButton'),status=document.getElementById('rescanStatus');imageRequestBusy=true;button.disabled=true;status.textContent='正在放大重掃…';
 try{
  const file=record?.scanPhoto?.file||record?.photo?.file||await (await fetch(preview.src)).blob();
  const scanned=await callLocalOCR(file,{quiet:true,scanScale:scale,region:previous.group_region});
  const candidates=scanned?.outfits||[scanned];
  const data=previous.group_region?candidates.find(d=>d&&(!d.group_region||JSON.stringify(d.group_region)===JSON.stringify(previous.group_region))):candidates[0];
  if(!data?.items?.length)throw new Error('未匹配到裝備，保留原結果');
  const exact=previous.items.map(matchEquipment).filter(m=>m?.matchType==='exact').map(m=>m.id),ids=new Set(data.items.map(matchEquipment).filter(Boolean).map(m=>m.id));
  if(exact.some(id=>!ids.has(id))||data.items.length<previous.items.length)throw new Error('未完整保留已確認裝備，保留原結果');
  for(const item of data.items){const old=previous.items.find(o=>o.slot===item.slot&&matchEquipment(o)?.id===matchEquipment(item)?.id);if(old&&explicitDye(old)){item.dye=old.dye;item.dye_setting=old.dye_setting;}}
  for(const key of ['source_url','source_author','outfit_title','group_label','group_region'])if(previous[key])data[key]=previous[key];
  if(record)record.data=data;currentOutfitData=data;renderResult(data);renderPostChoices();status.textContent=`${scale} 倍重掃完成：${data.items.length} 件裝備`;
 }catch(error){currentOutfitData=previous;renderResult(previous);status.textContent='重掃未完成：'+error.message;}
 finally{imageRequestBusy=false;button.disabled=false;}
}
document.addEventListener('DOMContentLoaded',()=>{
 document.getElementById('postUrl').addEventListener('paste',event=>{
  const text=event.clipboardData?.getData('text/plain')?.trim();if(!text||imageRequestBusy||explorationBatchBusy)return;
  try{for(const line of text.split(/\r?\n/).filter(s=>s.trim()))parsePostUrl(line.trim());}catch{return;}
  event.preventDefault();const input=event.currentTarget,start=input.selectionStart,end=input.selectionEnd;
  input.value=[input.value.slice(0,start).trim(),text,input.value.slice(end).trim()].filter(Boolean).join('\n');submitPostUrls();
 });
});
