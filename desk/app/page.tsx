import {auth} from "@clerk/nextjs/server";
import {SignInButton,SignOutButton} from "@clerk/nextjs";
import {hasDeskAccess} from "./lib/access";
import {Desk} from "./Desk";
export const dynamic="force-dynamic";
export default async function Page(){
 const {userId}=await auth();
 if(!userId)return <main className="gate"><div className="gate-card"><p className="eyebrow">ARCHITECTMENTOR / PRIVATE</p><h1>Architecture Desk</h1><p>Panel redakcyjny wymaga prywatnego logowania z MFA. Treści nie są publikowane automatycznie.</p><SignInButton mode="modal"><button>Zaloguj się</button></SignInButton></div></main>;
 if(!await hasDeskAccess())return <main className="gate"><div className="gate-card"><p className="eyebrow">BRAK UPRAWNIEŃ</p><h1>Dostęp ograniczony</h1><p>Twoje konto nie znajduje się na liście uprawnionych redaktorów.</p><SignOutButton><button>Wyloguj się</button></SignOutButton></div></main>;
 return <><header className="topbar"><span>ARCHITECTMENTOR <b>DESK</b></span><SignOutButton><button className="quiet">Wyloguj się</button></SignOutButton></header><Desk /></>;
}
