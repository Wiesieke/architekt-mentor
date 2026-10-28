import type {ReactNode} from "react";
import "./globals.css";
export const metadata={title:"ArchitectMentor | Prywatny Desk",robots:{index:false,follow:false}};
export default function Layout({children}:{children:ReactNode}){
 return <html lang="pl"><body>{children}</body></html>;
}
