const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup(inconsistent = false) {
 const writes = []; let ended = false; let transaction = false;
 const query = value => ({ select(){return this},session(){return this},lean(){return Promise.resolve(value)},then(resolve,reject){return Promise.resolve(value).then(resolve,reject)} });
 const session = { async withTransaction(fn){transaction=true;await fn()},async endSession(){ended=true} };
 const direction = {exists:async()=>true,findById:id=>query({_id:id}),updateOne:async(...args)=>writes.push(['direction',...args]),deleteOne:async(...args)=>writes.push(['delete',...args])};
 const division = {find:q=>query(q.direction==='source'?[{_id:'div',denomination:'Division'}]:[]),updateMany:async(...args)=>writes.push(['division',...args])};
 const service = {find:()=>query([{_id:'svc',division:inconsistent?'outside':'div'}]),updateMany:async(...args)=>writes.push(['service',...args])};
 const agent = {find:()=>query([{_id:'agent',division:'div',serviceRef:'svc',hrmsArchived:true}]),updateOne:async(...args)=>writes.push(['agent',...args])};
 const exports = {};
 vm.runInNewContext(fs.readFileSync(require.resolve('../controllers/directionTransferController'),'utf8'),{exports,require:name=> name==='mongoose'?{isValidObjectId:id=>Boolean(id),startSession:async()=>session}:name.includes('directionModel')?direction:name.includes('divisionModel')?division:name.includes('serviceModel')?service:agent});
 const res = {code:200,status(code){this.code=code;return this},json(body){this.body=body;return this}};
 return {controller:exports,res,writes,session,ended:()=>ended,transaction:()=>transaction};
}
test('rejects source as destination without modifying data',async()=>{const x=setup();await x.controller.transferAndDelete({params:{id:'source'},body:{targetDirectionId:'source'}},x.res);assert.equal(x.res.code,400);assert.equal(x.writes.length,0)});
test('moves hierarchy and archived agents in one transaction before deleting',async()=>{const x=setup();await x.controller.transferAndDelete({params:{id:'source'},body:{targetDirectionId:'target'}},x.res);assert.equal(x.res.code,200);assert.equal(x.transaction(),true);assert.deepEqual(x.writes.map(w=>w[0]),['division','service','agent','direction','delete']);for(const write of x.writes)assert.equal(write.at(-1).session,x.session);assert.equal(x.ended(),true)});
test('inconsistent service hierarchy blocks deletion before writes',async()=>{const x=setup(true);await x.controller.transferAndDelete({params:{id:'source'},body:{targetDirectionId:'target'}},x.res);assert.equal(x.res.code,400);assert.equal(x.writes.length,0);assert.equal(x.ended(),true)});
test('dependency list includes archived agents',async()=>{const x=setup();await x.controller.dependencies({params:{id:'source'}},x.res);assert.equal(x.res.body.agents[0].hrmsArchived,true);assert.equal(x.res.body.divisions.length,1);assert.equal(x.res.body.services.length,1)});
