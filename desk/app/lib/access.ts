import "server-only";
import {auth} from "@clerk/nextjs/server";
export async function hasDeskAccess():Promise<boolean>{
 const {userId}=await auth();
 const allowed=(process.env.DESK_ALLOWED_USER_IDS??"").split(",").map(v=>v.trim()).filter(Boolean);
 return Boolean(userId && allowed.length && allowed.includes(userId));
}
export function apiUrl(value:string|undefined):URL|null{
 if(!value)return null;
 try {
  const url=new URL(value);
  if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash)return null;
  return url;
 }catch{return null;}
}
