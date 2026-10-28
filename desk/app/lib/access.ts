import "server-only";
import {auth} from "../../auth";
export async function deskActor():Promise<string|null>{
 const session=await auth();
 const id=session?.githubId;
 if(!id||!/^\d{1,20}$/.test(id))return null;
 const allowed=(process.env.DESK_ALLOWED_GITHUB_IDS??"").split(",").map(v=>v.trim()).filter(Boolean);
 return allowed.includes(id)?"github_"+id:null;
}
export async function hasDeskAccess():Promise<boolean>{
 return (await deskActor())!==null;
}
export function apiUrl(value:string|undefined):URL|null{
 if(!value)return null;
 try{
  const url=new URL(value);
  if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash)return null;
  return url;
 }catch{return null;}
}
