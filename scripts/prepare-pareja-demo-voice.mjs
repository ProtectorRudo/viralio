import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

// Retain the uploaded voice memo as an immutable demo-only asset.
// The ASCII fragments are stored in Git, and restored before Next.js build/dev.
const root = process.cwd();
const fragments = Array.from({length:10},(_,index) =>
  readFileSync(join(root, "assets/tehiceesto/pareja-demo-voice", `chunk-${String(index).padStart(2,"0")}.b64`), "utf8").trim()
);
const recording = Buffer.from(fragments.join(""), "base64");
const expectedSha256 = "e78d66497a2b0c9eb6617a1e6106c2f27647b3562cf8b2abe7a52b442d49eb74";
if(recording.length !== 36892 || createHash("sha256").update(recording).digest("hex") !== expectedSha256){
  throw new Error("The Pareja demo voice recording failed its integrity check");
}
mkdirSync(join(root, "public"), {recursive:true});
writeFileSync(join(root, "public/tehiceesto-pareja-demo-v1.m4a"), recording);
console.log("TeHiceEsto: prepared the real Pareja demo voice (11.24 seconds, M4A)");
