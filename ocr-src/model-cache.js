const CACHE_NAME='ff14-ocr-models-v1';
// Cache failures must not prevent OCR (private browsing, storage quota, etc.).
export async function cachedModelFetch(url, options) {
  let cache;
  try {
    cache=await globalThis.caches?.open(CACHE_NAME);
    const saved=await cache?.match(url);
    if(saved)return saved;
  } catch { cache=null; }
  const response=await fetch(url,options);
  if(!response.ok)return response;
  if(cache){
    try { await cache.put(url,response.clone()); }
    catch { /* Continue with the downloaded model if persistence is unavailable. */ }
  }
  return response;
}
