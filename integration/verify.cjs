const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=path.resolve(__dirname,'..'),source=path.resolve(root,'../branch-2.6.0-a1');
for(const [file,hash] of Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname,'source-hashes.json'),'utf8'))))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(source,file))).digest('hex'),hash,file+' changed');
console.log('PASS experimental working files unchanged');
const {chromium}=require('C:/Users/dx90c/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5182/');await page.waitForFunction(()=>!!getCustomDatabase()?.records,{},{timeout:90000});
 await page.screenshot({path:path.join(root,'tests/results/integration-page.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.equal(errors.length,0);console.log('PASS desktop startup, mobile width and no browser exceptions');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
