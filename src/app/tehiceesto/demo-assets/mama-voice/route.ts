import chunk1 from "./chunk1";
import missing1 from "./missing1";
import missing2 from "./missing2";
import chunk2 from "./chunk2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const audioBase64 =
  chunk1.slice(0, 6988) +
  missing1 +
  chunk1.slice(6988, 11829) +
  missing2 +
  chunk1.slice(11829) +
  chunk2;

const audio = Buffer.from(audioBase64, "base64");

function baseHeaders() {
  return {
    "Content-Type": "audio/ogg",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
}

export async function GET(request: Request) {
  const range = request.headers.get("range");

  if (!range) {
    return new Response(audio, {
      status: 200,
      headers: {
        ...baseHeaders(),
        "Content-Length": String(audio.length),
      },
    });
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match) {
    return new Response(null, {
      status: 416,
      headers: {
        ...baseHeaders(),
        "Content-Range": `bytes */${audio.length}`,
      },
    });
  }

  const requestedStart = match[1] ? Number(match[1]) : 0;
  const requestedEnd = match[2] ? Number(match[2]) : audio.length - 1;
  const start = Math.max(0, Math.min(requestedStart, audio.length - 1));
  const end = Math.max(start, Math.min(requestedEnd, audio.length - 1));
  const body = audio.subarray(start, end + 1);

  return new Response(body, {
    status: 206,
    headers: {
      ...baseHeaders(),
      "Content-Length": String(body.length),
      "Content-Range": `bytes ${start}-${end}/${audio.length}`,
    },
  });
}
