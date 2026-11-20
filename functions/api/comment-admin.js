// Cloudflare Pages route: /api/comment-admin. Reuse the reviewed Node handler.
import legacyHandler from '../../api/comment-admin.js';
import {invokeNodeHandler} from '../_lib/node-adapter.mjs';
export const onRequest = (context) => invokeNodeHandler(legacyHandler, context);
