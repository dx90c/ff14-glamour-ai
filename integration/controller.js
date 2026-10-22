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
