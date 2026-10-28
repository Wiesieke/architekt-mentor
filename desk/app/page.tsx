import {auth,signIn,signOut} from "../auth";
import {hasDeskAccess} from "./lib/access";
import {Desk} from "./Desk";
export const dynamic="force-dynamic";
async function login(){ "use server"; await signIn("github",{redirectTo:"/"}); }
async function logout(){ "use server"; await signOut({redirectTo:"/"}); }
export default async function Page(){
 const session=await auth();
 if(!session)return <main className="gate"><div className="gate-card"><p className="eyebrow">ARCHITECTMENTOR / PRIVATE</p><h1>Architecture Desk</h1><p>Logowanie przez GitHub. Dostęp wyłącznie dla kont na zatwierdzonej liście. Szkice nie są publikowane automatycznie.</p><form action={login}><button>Zaloguj przez GitHub</button></form></div></main>;
 if(!await hasDeskAccess())return <main className="gate"><div className="gate-card"><p className="eyebrow">BRAK UPRAWNIEŃ</p><h1>Dostęp ograniczony</h1><p>Twoje konto GitHub nie znajduje się na liście uprawnionych redaktorów.</p><form action={logout}><button>Wyloguj się</button></form></div></main>;
 return <><header className="topbar"><span>ARCHITECTMENTOR <b>DESK</b></span><form action={logout}><button className="quiet">Wyloguj się</button></form></header><Desk /></>;
}
