import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

declare module "next-auth" {
 interface Session { githubId?: string }
}

function allowedGithubId(id:string|undefined):boolean {
 if(!id||!/^\d{1,20}$/.test(id))return false;
 const allowlist=(process.env.DESK_ALLOWED_GITHUB_IDS??"")
  .split(",").map(value=>value.trim()).filter(Boolean);
 return allowlist.includes(id);
}

// A GitHub identity is allowed only when its immutable numeric account ID
// appears in this desk's PRIVATE server-side allowlist. No database required.
export const {handlers,auth,signIn,signOut}=NextAuth({
 providers:[GitHub],
 session:{strategy:"jwt",maxAge:8*60*60},
 callbacks:{
  async signIn({account}){
   return account?.provider==="github"&&allowedGithubId(account.providerAccountId);
  },
  async jwt({token,account}){
   if(account?.provider==="github")token.githubId=account.providerAccountId;
   return token;
  },
  async session({session,token}){
   session.githubId=typeof token.githubId==="string"?token.githubId:undefined;
   return session;
  }
 }
});
