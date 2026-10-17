const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
function setup() {
 process.env.EXTERNAL_QDRO_OWNER_API_TOKEN='owner-test';
 process.env.EXTERNAL_QDRO_API_TOKEN='read-test';
 let data={ownerUid:'client',fields:{plan_family:'Test'},notes:[],history:[]};
 const db={collection:()=>({doc:()=>({})}),runTransaction:async fn=>fn({get:async()=>({exists:true,id:'request-1',data:()=>data}),update:(_,value)=>{data={...data,...value};}})};
 const file=path.resolve(__dirname,'../app/api/external/requests/route.ts');
 const mocks={'@/lib/firebase-admin':{getAdminDb:()=>db},'@/lib/field-format':{normalizePartyNames:x=>x,normalizeAllCapsName:x=>x},'@/lib/types':{requestStatuses:['Pending']}};
 const m=new Module(file,module);m.paths=module.paths;m.require=n=>mocks[n]||require(n);
 m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
 return {data:()=>data,patch:(body,token='owner-test')=>m.exports.PATCH(new Request('https://example.com/api/external/requests',{method:'PATCH',headers:{authorization:`Bearer ${token}`},body:JSON.stringify({requestId:'request-1',...body})}))};
}
const entry={id:'event-1',type:'email',body:'Follow-up email sent.',createdAt:'2026-10-16T10:30:00-06:00'};
test('owner appends history, returns it, and keeps notes separate',async()=>{
 const s=setup();const r=await s.patch({historyEntry:entry});assert.equal(r.status,200);
 const result=await r.json();assert.equal(result.request.history[0].createdAt,'2026-10-16T16:30:00.000Z');assert.deepEqual(s.data().notes,[]);
 await s.patch({historyEntry:{...entry,id:'event-2',type:'step_change'}});assert.equal(s.data().history.length,2);
});
test('retries are idempotent and existing history cannot be overwritten',async()=>{
 const s=setup();await s.patch({historyEntry:entry});await s.patch({historyEntry:entry});assert.equal(s.data().history.length,1);
 assert.equal((await s.patch({historyEntry:{...entry,body:'Changed'}})).status,400);assert.equal(s.data().history[0].body,entry.body);
});
test('server timestamps entries when no event date is provided',async()=>{
 const s=setup();const {createdAt,...input}=entry;assert.equal((await s.patch({historyEntry:input})).status,200);assert.ok(Number.isFinite(Date.parse(s.data().history[0].createdAt)));
});
test('invalid entries fail without writes',async()=>{
 for(const change of [{id:'bad/id'},{type:'invalid'},{body:' '},{body:'x'.repeat(2001)},{createdAt:'invalid'},{createdAt:'2026-10-16'}]){
 const s=setup();assert.equal((await s.patch({historyEntry:{...entry,...change}})).status,400);assert.equal(s.data().history.length,0);
 }
});
test('read-only token cannot append history',async()=>{
 const s=setup();assert.equal((await s.patch({historyEntry:entry},'read-test')).status,403);assert.equal(s.data().history.length,0);
});
