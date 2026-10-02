import crypto from "node:crypto";
import { gunzipSync } from "node:zlib";
import postgres from "postgres";
import { EBOOK_ASSET_KEY } from "@/ebook/server";

export const dynamic = "force-dynamic";

const INSTALL_TOKEN = "yjofHhkek1irntwdcyqoAGJrHJnH_17qsoB3PFpLqoA";
const EXPECTED_SHA256 = "7a86522f8f21d29d87ea781dba7908a98a9f922513c2d05c247c03ab2fe6758d";
const EXPECTED_SIZE = 4082541;

export async function POST(request: Request) {
  if (request.headers.get("x-install-token") !== INSTALL_TOKEN) {
    return Response.json({ ok: false }, { status: 404 });
  }

  const packed = Buffer.from(await request.arrayBuffer());
  const pdf = gunzipSync(packed);
  const sha = crypto.createHash("sha256").update(pdf).digest("hex");

  if (pdf.length !== EXPECTED_SIZE || sha !== EXPECTED_SHA256) {
    return Response.json({ ok: false, error: "checksum_mismatch" }, { status: 400 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return Response.json({ ok: false, error: "database_unavailable" }, { status: 503 });

  const sql = postgres(databaseUrl, { max: 1, connect_timeout: 10, prepare: false });
  try {
    await sql.unsafe(
      "insert into private.ebook_assets(asset_key,filename,mime_type,content_encoding,content,sha256,size_bytes,updated_at) " +
      "values ($1,$2,$3,$4,decode('','hex'),$5,$6,now()) " +
      "on conflict(asset_key) do update set filename=excluded.filename,mime_type=excluded.mime_type," +
      "content_encoding=excluded.content_encoding,sha256=excluded.sha256,size_bytes=excluded.size_bytes,updated_at=now()",
      [
        EBOOK_ASSET_KEY,
        "Anuncios_que_Venden_Playbook_2026.pdf",
        "application/pdf",
        "gzip",
        EXPECTED_SHA256,
        EXPECTED_SIZE,
      ],
    );

    await sql.unsafe("delete from private.ebook_asset_chunks where asset_key=$1", [EBOOK_ASSET_KEY]);

    const chunkSize = 220000;
    for (let offset = 0, index = 0; offset < packed.length; offset += chunkSize, index += 1) {
      const chunk = packed.subarray(offset, Math.min(offset + chunkSize, packed.length));
      await sql.unsafe(
        "insert into private.ebook_asset_chunks(asset_key,chunk_index,content) values ($1,$2,$3)",
        [EBOOK_ASSET_KEY, index, chunk],
      );
    }

    return Response.json({ ok: true, packedBytes: packed.length, pdfBytes: pdf.length, sha256: sha });
  } finally {
    await sql.end({ timeout: 2 }).catch(() => undefined);
  }
}
