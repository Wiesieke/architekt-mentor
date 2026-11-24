import {isLocalRequest, localHeaders, runDemo} from './service.server.mjs';

export const prerender = false;

export function GET({request, url, clientAddress}) {
  if (!import.meta.env.DEV || !isLocalRequest(request, url, clientAddress)) {
    return new Response(null, {status:404, headers:localHeaders});
  }
  const entries = [...url.searchParams];
  if (entries.length !== 1 || entries[0][0] !== 'example') {
    return Response.json({error:'Wybierz jeden syntetyczny przykład.'}, {status:400, headers:localHeaders});
  }
  const demo = runDemo(entries[0][1]);
  return demo
    ? Response.json(demo, {headers:localHeaders})
    : Response.json({error:'Nie znaleziono syntetycznego przykładu.'}, {status:404, headers:localHeaders});
}

export function ALL() {
  return new Response(null, {status:405, headers:{...localHeaders, Allow:'GET'}});
}
