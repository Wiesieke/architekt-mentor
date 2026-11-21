// Cloudflare Pages route: /api/enquiry. Reuse the reviewed Node handler.
import legacyHandler from '../../api/enquiry.js';
import {invokeNodeHandler} from '../_lib/node-adapter.mjs';
export const onRequest = (context) => invokeNodeHandler(legacyHandler, context);
