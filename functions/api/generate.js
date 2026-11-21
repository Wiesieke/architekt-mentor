// Cloudflare Pages route: /api/generate. Reuse the reviewed Node handler.
import legacyHandler from '../../api/generate.js';
import {invokeNodeHandler} from '../_lib/node-adapter.mjs';
export const onRequest = (context) => invokeNodeHandler(legacyHandler, context);
