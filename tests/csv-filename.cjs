const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');
const naming=html.slice(html.indexOf('function outfitFileName('),html.indexOf('async function buildOutfitXlsx('));
const csv=html.slice(html.indexOf('  function downloadCSV()'),html.indexOf('// === [SECTION: JS_PNG_EXPORT] START ==='));
class FixedDate extends Date{constructor(){super(2026,9,20,15,30,42)}}
const ctx=vm.createContext({Date:FixedDate,Blob,matchEquipment:it=>it.record?{names:{tc:it.record}}:null,matchedEquipmentExportName:(it,name)=>it.record||name,
 getHuijiWikiUrl:()=>({url:'https://example.test'}),resolveEquipmentSource:()=>({isVerified:true,sourceText:'測試來源'}),translateDyeSetting:x=>x,postSourceAuthor:()=>'',escapeCsv:x=>JSON.stringify(x??''),downloadBlob:(blob,name)=>ctx.filename=name});
vm.runInContext(naming+csv,ctx);
for(const [title,items,expected] of [
 ['我的穿搭',[{slot:'身體',name_zh:'外套'}],'20261020我的穿搭_153042.csv'],
 ['免費 OCR 外觀辨識',[{slot:'身體',name_zh:'外套',record:'靜修士鬥服'}],'20261020靜修士鬥服_153042.csv'],
 ['', [{slot:'手部',name_zh:'手套',record:'金匠手套'}]],
 ['標題/不合法:*?',[{slot:'身體',name_zh:'外套'}],'20261020標題_不合法____153042.csv'],
 ['',[],'20261020FF14外觀筆記_153042.csv']
]){
 ctx.currentOutfitData={outfit_title:title,items};vm.runInContext('downloadCSV()',ctx);
 const fallback=items.find(i=>i.slot==='身體')||items[0];const body=fallback?.record||fallback?.name_zh||'';
 assert.equal(ctx.filename,vm.runInContext(`outfitFileName(currentOutfitData.outfit_title,${JSON.stringify(body)}).replace(/\\.xlsx$/,'.csv')`,ctx));
 if(expected)assert.equal(ctx.filename,expected);
}
console.log('PASS CSV uses XLSX naming: timestamp, title, body / first-item fallback, safe characters and empty fallback');
