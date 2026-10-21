const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');
const assembly=html.slice(html.indexOf('function assembleOCRItems('),html.indexOf('// === [SECTION: JS_OCR_REFINEMENT] END ==='));
const ctx=vm.createContext({Set,Map,ocrBox:line=>{const xs=line.poly.map(p=>p[0]),ys=line.poly.map(p=>p[1]);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)}},ocrGear:line=>line.id?{id:line.id,matchType:'exact'}:null,ocrDye:line=>line.dye?{name:line.dye}:null,matchEquipment:item=>({names:{tc:item.name_zh}})});
vm.runInContext(assembly+html.split('// === [SECTION: JS_OUTFIT_LAYOUTS] START ===')[1].split('// === [SECTION: JS_OUTFIT_LAYOUTS] END ===')[0],ctx);
const line=(id,x,y,dye)=>({id,text:id||'dye',dye,score:.99,poly:[[x,y],[x+150,y],[x+150,y+20],[x,y+20]]});
const slots={LH:3,LB:4,LA:5,RH:3,RB:4,RA:5};
const left=[line('LH',20,30),line('LB',20,230),line('LA',20,430)],right=[line('RH',800,30),line('RB',800,230),line('RA',800,430)];
function run(lines){ctx.lines=lines;ctx.slots=slots;return vm.runInContext('assembleOutfitLayouts(lines,slots,1000)',ctx)}
let data=run([...left,...right,line(null,20,260,'LEFT'),line(null,800,260,'RIGHT'),line(null,450,260,'BOUNDARY')]);
assert.equal(data.outfits.length,2);assert(data.outfits[0].items.some(i=>i.dye==='LEFT'));assert(data.outfits[1].items.some(i=>i.dye==='RIGHT'));
assert(!data.outfits[0].items.some(i=>/RIGHT|BOUNDARY/.test(i.dye)));assert(!data.outfits[1].items.some(i=>/LEFT|BOUNDARY/.test(i.dye)));
assert(!run(left).outfits);
assert(!run([...left,...right.map((r,i)=>({...r,id:left[i].id,text:left[i].text}))]).outfits);
assert(!run([...left,...right.filter(r=>r.id!=='RB')]).outfits);
assert(!run([...left,...right.map(r=>({...r,poly:r.poly.map(([x,y])=>[x-700,y+700])}))]).outfits);
console.log('PASS left/right separation, no cross-column dye, crossing-label rejection, single-column / duplicate-language / insufficient / stacked fallback');
