import "server-only";
import {createCipheriv,createDecipheriv,randomBytes} from "node:crypto";
import {cierreDb} from "./db";

function key():Buffer{
 const raw=process.env.CIERRE_TOKEN_ENCRYPTION_KEY||"";
 const bytes=Buffer.from(raw,"base64");
 if(bytes.length!==32)throw Error("CIERRE_TOKEN_ENCRYPTION_KEY_requires_32_bytes_base64");
 return bytes;
}
export function encryptProviderToken(token:string):string{
 if(token.length<20 || token.length>3000)throw Error("invalid_provider_token");
 const nonce=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key(),nonce);
 const encrypted=Buffer.concat([cipher.update(token,"utf8"),cipher.final()]);
 return [nonce.toString("base64url"),cipher.getAuthTag().toString("base64url"),encrypted.toString("base64url")].join(".");
}
export function decryptProviderToken(encoded:string):string{
 const parts=encoded.split(".");
 if(parts.length!==3)throw Error("bad_encrypted_token");
 const nonce=Buffer.from(parts[0],"base64url"),tag=Buffer.from(parts[1],"base64url"),data=Buffer.from(parts[2],"base64url");
 if(nonce.length!==12||tag.length!==16)throw Error("bad_token_aead");
 const cipher=createDecipheriv("aes-256-gcm",key(),nonce);cipher.setAuthTag(tag);
 return Buffer.concat([cipher.update(data),cipher.final()]).toString("utf8");
}
export async function tokenForBusiness(businessId:string):Promise<string>{
 const rows=await cierreDb().unsafe("select encrypted_access_token,expires_at from public.cierre_provider_tokens where business_id=$1 limit 1",[businessId]);
 if(!rows.length)throw Error("tenant_not_onboarded_with_meta");
 if(rows[0].expires_at&&new Date(rows[0].expires_at).getTime()<Date.now()+90000)throw Error("meta_provider_token_expired");
 return decryptProviderToken(String(rows[0].encrypted_access_token));
}
