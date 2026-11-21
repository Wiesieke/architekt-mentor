// Cloudflare Pages route: /api/evaluate-puzzle. Reuse the reviewed Node handler.
import legacyHandler from '../../api/evaluate-puzzle.js';
import {invokeNodeHandler} from '../_lib/node-adapter.mjs';
export const onRequest = (context) => invokeNodeHandler(legacyHandler, context);
