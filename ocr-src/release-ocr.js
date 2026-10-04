import { PaddleOCR } from '@paddleocr/paddleocr-js';
import wasm from './node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm?url';
import mjs from './node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs?url';
const base=window.__FF14_OCR_ASSET_BASE__;
let engine;
window.FF14OCR={async recognize(file){
  if(!engine)engine=await PaddleOCR.create({textDetectionModelName:'PP-OCRv5_mobile_det',textRecognitionModelName:'PP-OCRv5_mobile_rec',ortOptions:{backend:'wasm',numThreads:1,wasmPaths:{wasm:new URL(wasm,base).href,mjs:new URL(mjs,base).href}}});
  const [result]=await engine.predict(file);return result;
}};
