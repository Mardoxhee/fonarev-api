const {test}=require('node:test');const assert=require('node:assert/strict');
const storage=require('../utils/recruitmentStorage');
test('upload uses photo multipart contract and reads approved MinIO URL',async()=>{
 global.fetch=async(url,opts)=>{assert.equal(url,'https://minio2.fonasite.app/minio/files/upload');assert.equal(opts.method,'POST');assert.equal(opts.body.get('file').name,'unique.pdf');return Response.json({data:{src:'https://minio2.fonasite.app/bucket/a.pdf'}});};
 assert.equal(await storage.upload({buffer:Buffer.from('%PDF-test')},'unique'),'https://minio2.fonasite.app/bucket/a.pdf');
 global.fetch=async()=>new Response('%PDF-test');assert.equal((await storage.read('https://minio2.fonasite.app/bucket/a.pdf')).toString(),'%PDF-test');
});
test('resolves stored keys, rejects unsafe hosts and non PDF',async()=>{
 global.fetch=async(url)=>url.includes('/minio/files/')?Response.json({data:'https://minio2.fonasite.app/bucket/a.pdf'}):new Response('%PDF-test');
 assert.equal((await storage.read('abc')).toString(),'%PDF-test');
 await assert.rejects(storage.read('https://example.org/file.pdf'));
 global.fetch=async()=>new Response('<html>error</html>');await assert.rejects(storage.read('https://minio2.fonasite.app/bucket/a.pdf'));
});
test('upload failure and missing reference fail without success response',async()=>{
 global.fetch=async()=>new Response('',{status:503});await assert.rejects(storage.upload({buffer:Buffer.from('%PDF-test')},'unique'));
 global.fetch=async()=>Response.json({});await assert.rejects(storage.upload({buffer:Buffer.from('%PDF-test')},'unique'));
});
