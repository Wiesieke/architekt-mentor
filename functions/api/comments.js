// Cloudflare Pages route: /api/comments. Reuse the reviewed Node handler.
import legacyHandler from '../../api/comments.js';
import {invokeNodeHandler} from '../_lib/node-adapter.mjs';
export const onRequest = (context) => invokeNodeHandler(legacyHandler, context);
