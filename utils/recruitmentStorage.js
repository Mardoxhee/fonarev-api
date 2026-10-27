// Same file service and multipart contract as HRMS photos/documents. Node 18+.
const base = () => (process.env.FONAREV_FILE_BASE_ROUTE || 'https://minio2.fonasite.app/minio/files').replace(/\/$/, '');
const headers = () => process.env.FONAREV_FILE_TOKEN ? {Authorization: `Bearer ${process.env.FONAREV_FILE_TOKEN}`} : {};
function source(payload) { return payload.url || (typeof payload.data === 'string' ? payload.data : payload.data?.src); }
function trusted(value) {
  const url = new URL(value);
  const hosts = new Set([new URL(base()).hostname, 'minio.360.fonasite.app', 'minio2.fonasite.app']);
  if (url.protocol !== 'https:' || !hosts.has(url.hostname) || url.username || url.password) throw new Error('Invalid storage URL');
  return url.href;
}
exports.upload = async (file, name) => {
  const form = new FormData();
  form.append('file', new Blob([file.buffer], {type:'application/pdf'}), name + '.pdf');
  const response = await fetch(process.env.FONAREV_FILE_UPLOAD_ROUTE || base() + '/upload', {method:'POST', headers:headers(), body:form, signal:AbortSignal.timeout(30000)});
  if (!response.ok) throw new Error('Storage upload failed');
  const key = source(await response.json());
  if (typeof key !== 'string' || !key.trim()) throw new Error('Missing storage reference');
  if (/^https?:/i.test(key)) trusted(key);
  return key.trim();
};
exports.read = async (key) => {
  let url = key;
  if (!/^https?:/i.test(key)) {
    const response = await fetch(base() + '/' + key.split('/').map(encodeURIComponent).join('/'), {headers:headers(), signal:AbortSignal.timeout(15000), redirect:'error'});
    if (!response.ok) throw new Error('Storage resolution failed');
    url = source(await response.json());
  }
  const response = await fetch(trusted(url), {signal:AbortSignal.timeout(30000), redirect:'error'});
  if (!response.ok) throw new Error('Storage read failed');
  const reader = response.body.getReader(); const chunks=[]; let size=0;
  while (true) { const {done,value}=await reader.read(); if(done)break; size+=value.length; if(size>5*1024*1024){await reader.cancel();throw new Error('File too large');} chunks.push(Buffer.from(value)); }
  const data=Buffer.concat(chunks);
  if(data.subarray(0,5).toString()!=='%PDF-')throw new Error('Invalid PDF');
  return data;
};
