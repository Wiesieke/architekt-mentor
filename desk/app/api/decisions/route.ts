import {NextRequest,NextResponse} from "next/server";
import {apiUrl,deskActor} from "../../lib/access";
export const runtime="nodejs";export const dynamic="force-dynamic";
function fail(status:number,code:string){return NextResponse.json({ok:false,code},{status,headers:{"Cache-Control":"no-store"}});}
export async function POST(request:NextRequest){
 const actor=await deskActor();
 if(!actor)return fail(403,"forbidden");
 const host=request.headers.get("host"),origin=request.headers.get("origin");
 try {
  if(!host||!origin||new URL(origin).host!==host||new URL(origin).protocol!=="https:")
   return fail(403,"cross_origin");
 }catch{return fail(403,"cross_origin");}
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json")return fail(415,"json_required");
 const endpoint=apiUrl(process.env.AM_RADAR_EDITOR_API_URL);
 const token=process.env.AM_RADAR_EDITOR_API_TOKEN??"";
 if(!endpoint||token.length<32)return fail(503,"write_not_configured");
 const raw=await request.text();if(raw.length>6000)return fail(413,"too_large");
 let payload:unknown;try{payload=JSON.parse(raw);}catch{return fail(400,"invalid_json");}
 if(!payload||typeof payload!=="object"||Array.isArray(payload))return fail(400,"invalid_payload");
 try{
  const response=await fetch(endpoint.href,{method:"POST",headers:{Authorization:"Bearer "+token,"X-Editorial-Actor":actor,"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(payload),cache:"no-store",signal:AbortSignal.timeout(10000)});
  const json=await response.json().catch(()=>({ok:false,code:"invalid_upstream_response"}));
  const status=[200,400,401,404,409,413,415,422,503].includes(response.status)?response.status:502;
  return NextResponse.json(json,{status,headers:{"Cache-Control":"no-store"}});
 }catch{return fail(502,"upstream_unavailable");}
}
