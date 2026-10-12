import { PaddleOCR } from '@paddleocr/paddleocr-js';
import wasm from './node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm?url';
import mjs from './node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs?url';
import manifest from '../ocr/models/manifest.json';
import { cachedModelFetch } from './model-cache.js';
const base=window.__FF14_OCR_ASSET_BASE__;
const engines=new Map();
const asset=name=>({url:new URL('models/'+manifest.models[name].file,base).href});
window.FF14OCR={async recognize(file,{language='default'}={}){
 const key=language==='ko'?'ko':'default';
 if(!engines.has(key))engines.set(key,PaddleOCR.create({textDetectionModelName:'PP-OCRv5_mobile_det',textRecognitionModelName:key==='ko'?'korean_PP-OCRv5_mobile_rec':'PP-OCRv5_mobile_rec',textDetectionModelAsset:asset('PP-OCRv5_mobile_det'),textRecognitionModelAsset:asset(key==='ko'?'korean_PP_OCRv5_mobile_rec':'PP-OCRv5_mobile_rec'),fetch:cachedModelFetch,ortOptions:{backend:'wasm',numThreads:1,wasmPaths:{wasm:new URL(wasm,base).href,mjs:new URL(mjs,base).href}}}).catch(error=>{engines.delete(key);throw error;}));
 const engine=await engines.get(key);
 const [result]=await engine.predict(file);
 result.language=key;
 return result;
}};
