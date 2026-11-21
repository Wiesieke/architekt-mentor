// Cloudflare Pages route: /api/event-interest. Reuse the reviewed Node handler.
import legacyHandler from '../../api/event-interest.js';
import {invokeNodeHandler} from '../_lib/node-adapter.mjs';
export const onRequest = (context) => invokeNodeHandler(legacyHandler, context);
