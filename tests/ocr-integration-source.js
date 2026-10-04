// === [SECTION: JS_LOCAL_OCR] START ===
async function callLocalOCR(file) {
  const loading=document.getElementById('loadingBox');
  loading.style.display='block';document.getElementById('resultSection').style.display='none';
  document.getElementById('statusLogList').innerHTML='';
  try {
    if(location.protocol==='file:')throw new Error('請先啟動 OCR 測試伺服器，並開啟 http://127.0.0.1:5174/test231.html');
    if(!getCustomDatabase()?.records)throw new Error('請先在裝備庫匯入或同步完整 JSON，再進行 OCR 辨識');
    document.getElementById('loadingMsg').textContent='載入免費 OCR 模型與辨識圖片…';
    appendStatusLog('免費 OCR','圖片在本機瀏覽器辨識；首次需下載模型','info');
    const {recognize}=await import('/ocr-bridge.js');
    const response=await fetch('/ocr-slots.json');if(!response.ok)throw new Error('裝備部位索引載入失敗');
    const slots=await response.json();
    const restrictionResponse=await fetch('/ocr-restrictions.json');
    if(!restrictionResponse.ok)throw new Error('裝備限制索引載入失敗');
    const restrictions=await restrictionResponse.json();
    const result=await recognize(file);
    const data=assembleOCRItems(result.items,slots);
    data.note=equipmentRestrictionNote(data.items,restrictions.items);
    if(!data.items.length)throw new Error('未匹配到裝備名稱。請使用名稱文字清楚的原始截圖，或切換 AI 模式');
    renderResult(data);currentOutfitData=data;
    appendStatusLog('完成',`辨識 ${result.items.length} 行，裝備 ${data.items.length} 件；信心分數不等於正確率`,'info');
  } finally {loading.style.display='none';}
}
function equipmentRestrictionNote(items,restrictions) {
  const matched=items.map(item=>({item,match:matchEquipment(item)})).filter(x=>x.match?.id);
  const known=matched.filter(x=>restrictions[x.match.id]?.jobs?.length);
  const notes=[];
  if(known.length>1){
    const shared=known.map(x=>restrictions[x.match.id].jobs).reduce((a,b)=>a.filter(job=>b.includes(job)));
    if(!shared.length)notes.push(`${known.some(x=>x.match.matchType==='fuzzy')?'疑似':''}包含不同職業限定裝備，繁中服請注意投影職業限制${known.length<matched.length?'（部分裝備職業資料未收錄）':''}。`);
  }
  const raceNames={'Hyur':'人族','Elezen':'精靈族','Lalafell':'拉拉菲爾族',"Miqo'te":'貓魅族','Roegadyn':'魯加族','Au Ra':'敖龍族','Hrothgar':'硌獅族','Viera':'維艾拉族'};
  for(const {item,match} of matched){
    let fit=restrictions[match.id]?.fits;if(!fit)continue;
    for(const [en,zh] of Object.entries(raceNames))fit=fit.replaceAll(en,zh);
    fit=fit.replaceAll('♀','女性角色').replaceAll('♂','男性角色');
    notes.push(`${match.matchType==='fuzzy'?'疑似匹配：':''}${match.names.tc||match.names.chs||item.name_zh}限 ${fit} 使用。`);
  }
  return [...new Set(notes)].join(' ');
}
function assembleOCRItems(lines,slots) {
  const slotNames={1:'主手',2:'副手',3:'頭部',4:'身體',5:'手部',6:'腰部',7:'腿部',8:'腳部',9:'耳飾',10:'項鍊',11:'手環',12:'戒指',13:'戒指'};
  const box=line=>{const xs=line.poly.map(p=>p[0]),ys=line.poly.map(p=>p[1]);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};};
  const matches=[];
  for(const line of lines){
    if(line.score<0.5)continue;
    const raw=line.text.trim();if(lookupSingleOfficialDye(raw))continue;
    const match=matchEquipment({name_zh:raw,name_en_jp:''});
    if(!match?.id || !slotNames[slots[match.id]])continue;
    const old=matches.find(x=>x.match.id===match.id);
    const candidate={line,match,b:box(line)};
    if(!old)matches.push(candidate);
    else if(match.matchType==='exact' && old.match.matchType!=='exact' || match.matchType===old.match.matchType && line.score>old.line.score)Object.assign(old,candidate);
  }
  const items=matches.map(({line,match,b})=>{
    const dyeLines=lines.filter(other=>{
      const q=box(other);return other.score>=0.5 && /[\p{L}]/u.test(other.text) && q.y>b.y+b.h/2 && q.y<b.y+Math.max(b.h*7,55) && Math.abs(q.x+q.w/2-b.x-b.w/2)<Math.max(b.w*0.75,45) && lookupSingleOfficialDye(other.text.trim());
    }).filter(other=>!matches.some(m=>m.match.id!==match.id && m.b.y>b.y && m.b.y<box(other).y && Math.abs(m.b.x-b.x)<Math.max(b.w,45)));
    const dyes=[...new Set(dyeLines.map(x=>lookupSingleOfficialDye(x.text.trim())))];
    return {slot:slotNames[slots[match.id]],name_zh:line.text,name_en_jp:'',name_huiji:'',source:'',dye:dyes.length?dyes.join(' / '):'未辨識染色（OCR）'};
  });
  items.sort((a,b)=>Object.values(slotNames).indexOf(a.slot)-Object.values(slotNames).indexOf(b.slot));
  return {outfit_title:'免費 OCR 外觀辨識',note:'',items};
}
// === [SECTION: JS_LOCAL_OCR] END ===
