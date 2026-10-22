import "server-only";
import postgres from "postgres";
import {createHmac} from "node:crypto";

type Sql=ReturnType<typeof postgres>;
const cache=globalThis as typeof globalThis & {cierreSql?:Sql};
export function cierreDb():Sql{
 // CIERRE stores tenant tables in its dedicated Supabase project. Never fall back
 // to Viralio DATABASE_URL, which may refer to another PostgreSQL instance.
 const url=process.env.CIERRE_DATABASE_URL;
 if(!url)throw Error("CIERRE_DATABASE_URL_not_configured");
 if(!cache.cierreSql)cache.cierreSql=postgres(url,{max:3,idle_timeout:15,prepare:false});
 return cache.cierreSql;
}
export function contactDigest(businessId:string,phone:string):string{
 const key=process.env.CIERRE_CONTACT_HASH_KEY;
 if(!key || key.length<24)throw Error("CIERRE_CONTACT_HASH_KEY_not_configured");
 return createHmac("sha256",key).update(businessId+"|"+phone).digest("hex");
}
