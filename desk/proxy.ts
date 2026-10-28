import {clerkMiddleware} from "@clerk/nextjs/server";
export default clerkMiddleware();
export const config={matcher:["/((?!_next|.*\\.(?:css|js|png|jpg|svg|ico|woff2?|webmanifest)).*)","/(api)(.*)","/__clerk/(.*)"]};
