import {NextResponse} from "next/server";
import {apiUrl,hasDeskAccess} from "../../lib/access";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 if(!await hasDeskAccess())return NextResponse.json({ok:false,code:"forbidden"},{status:403});
 const endpoint=apiUrl(process.env.AM_RADAR_API_URL);
 const token=process.env.AM_RADAR_API_TOKEN??"";
 if(!endpoint||token.length<32)return NextResponse.json({ok:false,code:"not_configured"},{status:503});
 endpoint.searchParams.set("limit","100");
 try{
  const response=await fetch(endpoint.href,{headers:{Authorization:"Bearer "+token,Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(10000)});
  if(!response.ok)return NextResponse.json({ok:false,code:"upstream_unavailable"},{status:502});
  const data:unknown=await response.json();
  if(!data||typeof data!=="object"||!("ok" in data)||(data as {ok:unknown}).ok!==true||!("items" in data)||!Array.isArray((data as {items:unknown}).items))
   return NextResponse.json({ok:false,code:"invalid_upstream_response"},{status:502});
  return NextResponse.json(data,{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({ok:false,code:"upstream_unavailable"},{status:502});}
}
