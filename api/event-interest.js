const events = require('../data/events.json');
const ids = new Set(events.map(e => e.id));
const actions = new Set(['card_view','detail_view','organizer_click','learning_click','interest_click']);
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  if (!String(req.headers['content-type'] || '').startsWith('application/json') || Number(req.headers['content-length']) > 512) return res.status(400).json({error:'Invalid request'});
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin && (!host || origin !== `https://${host}` && origin !== `http://${host}`)) return res.status(403).json({error:'Invalid origin'});
  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body); } catch {body=null;}
  if (!body || typeof body !== 'object' || Array.isArray(body) || !ids.has(body.eventId) || !actions.has(body.action) || !['pl','en'].includes(body.locale) || Object.keys(body).some(k=>!['eventId','action','locale'].includes(k))) return res.status(400).json({error:'Invalid event'});
  // Counts actions, not unique people. No user identifiers or free text.
  console.info(JSON.stringify({type:'architectmentor_event_signal',eventId:body.eventId,action:body.action,locale:body.locale}));
  return res.status(200).json({ok:true});
};
