import test from 'node:test';
import assert from 'node:assert/strict';
import {invokeNodeHandler} from '../functions/_lib/node-adapter.mjs';

test('adapts a JSON POST and preserves status, query, and response headers', async () => {
  const handler = async (req, res) => {
    assert.equal(req.method, 'POST');
    assert.equal(req.query.locale, 'en');
    assert.deepEqual(req.body, {brief:'architecture'});
    assert.equal(req.headers['x-forwarded-for'], '192.0.2.3');
    res.setHeader('X-Test', 'yes');
    res.status(201).json({ok:true});
  };
  const response = await invokeNodeHandler(handler, {request:new Request('https://ejsymont.com/api/generate?locale=en',{
    method:'POST',headers:{'content-type':'application/json','cf-connecting-ip':'192.0.2.3','x-forwarded-for':'203.0.113.9'},
    body:JSON.stringify({brief:'architecture'})
  })});
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('x-test'), 'yes');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), {ok:true});
});
test('supports HTML and redirect responses for moderation', async () => {
  const response = await invokeNodeHandler((req,res)=>{
    assert.equal(req.body, 'action=approve');
    res.setHeader('Location','/api/comment-admin');
    res.status(303).end();
  }, {request:new Request('https://ejsymont.com/api/comment-admin',{
    method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:'action=approve'
  })});
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'),'/api/comment-admin');
});
test('rejects oversized requests before invoking a handler', async () => {
  let invoked = false;
  const response = await invokeNodeHandler(()=>{invoked=true;},{
    request:new Request('https://ejsymont.com/api/generate',{method:'POST',body:'x'.repeat(65537)})
  });
  assert.equal(invoked,false);
  assert.equal(response.status,413);
});
test('never reports successful empty API handlers', async () => {
  const response = await invokeNodeHandler(async ()=>{}, {request:new Request('https://ejsymont.com/api/health')});
  assert.equal(response.status,500);
});
test('fails closed for unexpected exceptions without exposing details', async () => {
  const response = await invokeNodeHandler(async ()=>{throw new Error('sensitive token text');},{
    request:new Request('https://ejsymont.com/api/test')
  });
  assert.equal(response.status,502);
  assert.doesNotMatch(await response.text(), /sensitive token/i);
});
