
  let paddleEngineLoading;
  function loadPaddleEngine() {
    if(window.FF14OCR)return Promise.resolve();
    if(paddleEngineLoading)return paddleEngineLoading;
    window.__FF14_OCR_ASSET_BASE__=location.protocol==='file:'?'https://dx90c.github.io/ff14-glamour-ai/ocr/':new URL('./ocr/',location.href).href;
    paddleEngineLoading=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=new URL('ocr.js',window.__FF14_OCR_ASSET_BASE__).href;
      script.onload=()=>window.FF14OCR?resolve():reject(new Error('OCR 引擎未初始化'));
      script.onerror=()=>{script.remove();paddleEngineLoading=null;reject(new Error('OCR 引擎下載失敗，請確認網路後重試'));};
      document.head.append(script);
    });return paddleEngineLoading;
  }
async function callLocalOCR(file) {
  const loading=document.getElementById('loadingBox');
  loading.style.display='block';document.getElementById('resultSection').style.display='none';
  document.getElementById('statusLogList').innerHTML='';
  try {

    if(!getCustomDatabase()?.records)throw new Error('請先在裝備庫匯入或同步完整 JSON，再進行 OCR 辨識');
    document.getElementById('loadingMsg').textContent='準備文字辨識模型並辨識圖片…';
    appendStatusLog('免費 OCR','圖片在本機瀏覽器辨識；模型由本站取得，快取可用時直接重用','info');
    if(location.protocol==='file:')throw new Error('免費 OCR 需要透過 HTTP(S) 網址開啟。請使用線上版；直接雙擊下載的 HTML 僅可使用 AI 模式。');
    await loadPaddleEngine();
    const {recognize}=window.FF14OCR;
    const db=getCustomDatabase();
    if(!db.ocrSupport?.slots && location.protocol!=='file:') {
      const response=await fetch(new URL('./ff14_database.json',location.href));
      if(response.ok){const bundled=await response.json();if(bundled.ocrSupport){db.ocrSupport=bundled.ocrSupport;await saveDatabaseToIDB(db);}}
    }
    if(!db.ocrSupport?.slots)throw new Error('請匯入 v2.4.3 裝備庫以取得部位與限制索引');
    const slots=db.ocrSupport.slots;
    const restrictions={items:db.ocrSupport.restrictions};
    const result=await recognize(file);
    const refined=await refineOCRLines(file,result.items,slots,recognize);
    const data=assembleOCRItems(refined,slots);
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
// === [SECTION: JS_OCR_REFINEMENT] START ===
function ocrBox(line) {
  const xs=line.poly.map(p=>p[0]),ys=line.poly.map(p=>p[1]);
  return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
}
function ocrDye(line) {
  const raw=line.text.trim();
  const prefix=raw.match(/^([①②]|[12])\s*[-:：.)]?\s*(.+)$/);
  const text=prefix?prefix[2]:raw;
  if(!/[\p{L}]/u.test(text))return null;
  const name=lookupSingleOfficialDye(text);
  return name?{name,channel:prefix?({'①':1,'②':2}[prefix[1]]||Number(prefix[1])):null}:null;
}
function ocrGear(line,slots) {
  if(line.score<0.5 || ocrDye(line))return null;
  const match=matchEquipment({name_zh:line.text.trim(),name_en_jp:''});
  return match?.id&&slots[match.id]?match:null;
}
async function refineOCRLines(file,lines,slots,recognize) {
  const gears=lines.map(line=>({line,match:ocrGear(line,slots),b:ocrBox(line)})).filter(x=>x.match);
  // ponytail: bounded retries, extend only after real screenshots demonstrate missed regions.
  const retry=lines.filter(line=>{
    if(ocrGear(line,slots)?.matchType==='exact'||ocrDye(line))return false;
    if(!/[\p{L}]/u.test(line.text)||line.text.trim().length<3)return false;
    const b=ocrBox(line);
    return (b.h<32||line.score<0.8)&&(gears.length?gears.some(g=>Math.abs(b.x+b.w/2-g.b.x-g.b.w/2)<Math.max(b.w,g.b.w)*0.7&&Math.abs(b.y-g.b.y)<Math.max(120,g.b.h*10)):b.h<24&&line.text.trim().length>=5);
  }).slice(0,8);
  if(!retry.length)return lines;
  const bitmap=await createImageBitmap(file);const improved=[...lines];
  try{
    for(const original of retry){
      const b=ocrBox(original),padding=Math.max(4,b.h*.4);
      const x=Math.max(0,b.x-padding),y=Math.max(0,b.y-padding);
      const w=Math.min(bitmap.width-x,b.w+padding*2),h=Math.min(bitmap.height-y,b.h+padding*2);
      if(w<=0||h<=0)continue;
      const scale=Math.min(3,2400/w,600/h);if(scale<=1)continue;
      const canvas=document.createElement('canvas');canvas.width=Math.ceil(w*scale);canvas.height=Math.ceil(h*scale);
      canvas.getContext('2d').drawImage(bitmap,x,y,w,h,0,0,canvas.width,canvas.height);
      try{
        const result=await recognize(canvas);
        const candidates=result.items.map(line=>({...line,poly:line.poly.map(p=>[x+p[0]/scale,y+p[1]/scale])}));
        const before=ocrGear(original,slots);
        const usable=candidates.filter(line=>{
          const after=ocrGear(line,slots);
          return after?(!before||before.id===after.id):(ocrDye(line)&&!before);
        });
        const ids=new Set(usable.map(line=>ocrGear(line,slots)?.id).filter(Boolean));
        if(ids.size>1)continue;
        if(usable.length){improved.splice(improved.indexOf(original),1,...usable);}
      }catch(error){console.warn('OCR 區域重讀未完成，保留原結果',error);}
    }
  }finally{bitmap.close();}
  return improved;
}
function assembleOCRItems(lines,slots) {
  const slotNames={1:'主手',2:'副手',3:'頭部',4:'身體',5:'手部',6:'腰部',7:'腿部',8:'腳部',9:'耳飾',10:'項鍊',11:'手環',12:'戒指',13:'戒指'};
  const groups=[];
  for(const line of lines){
    const match=ocrGear(line,slots);if(!match||!slotNames[slots[match.id]])continue;
    const b=ocrBox(line);
    // Merge nearby bilingual labels, but retain separately displayed identical equipment.
    let group=groups.find(g=>g.match.id===match.id&&g.labels.some(l=>{const q=ocrBox(l);return Math.abs(q.y-b.y)<Math.max(q.h,b.h)*4&&Math.abs(q.x+q.w/2-b.x-b.w/2)<Math.max(q.w,b.w)*.7;}));
    if(!group){groups.push({match,line,labels:[line],dyes:[]});continue;}
    group.labels.push(line);
    if(match.matchType==='exact'&&group.match.matchType!=='exact'||match.matchType===group.match.matchType&&line.score>group.line.score){group.line=line;group.match=match;}
  }
  for(const line of lines){
    const dye=ocrDye(line);if(!dye||line.score<.5)continue;
    const b=ocrBox(line);
    const candidates=groups.map(group=>{
      const boxes=group.labels.map(ocrBox),bottom=Math.max(...boxes.map(q=>q.y+q.h));
      const last=boxes.reduce((a,q)=>q.y>a.y?q:a),dy=b.y-bottom;
      const dx=Math.abs(b.x+b.w/2-last.x-last.w/2);
      const width=Math.max(last.w,b.w,45);
      return {group,dy,dx,width,valid:dy>=-Math.min(b.h,last.h)*.25&&dy<Math.max(55,last.h*7)&&dx<width*.7};
    }).filter(c=>c.valid).sort((a,b)=>(a.dy+a.dx*.5)-(b.dy+b.dx*.5));
    if(!candidates.length)continue;
    if(candidates[1]&&Math.abs((candidates[0].dy+candidates[0].dx*.5)-(candidates[1].dy+candidates[1].dx*.5))<b.h*.5)continue;
    candidates[0].group.dyes.push({...dye,b});
  }
  const items=groups.map(group=>{
    const marked=group.dyes.filter(d=>d.channel),plain=group.dyes.filter(d=>!d.channel).sort((a,b)=>a.b.y-b.b.y);
    const channels=new Map();
    for(const d of marked){const old=channels.get(d.channel);channels.set(d.channel,old&&old!==d.name?'未辨識染色（OCR）':d.name);}
    let dye;
    if(channels.size)dye=[1,2].filter(n=>channels.has(n)).map(n=>`${n===1?'①':'②'} ${channels.get(n)}`).join(' / ');
    else dye=[...new Set(plain.map(d=>d.name))].join(' / ')||'未辨識染色（OCR）';
    return {slot:slotNames[slots[group.match.id]],name_zh:group.line.text,name_en_jp:'',name_huiji:'',source:'',dye};
  });
  items.sort((a,b)=>Object.values(slotNames).indexOf(a.slot)-Object.values(slotNames).indexOf(b.slot));
  return {outfit_title:'免費 OCR 外觀辨識',note:'',items};
}
// === [SECTION: JS_OCR_REFINEMENT] END ===

