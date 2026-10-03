export async function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="wax" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#e79aa8"/>
        <stop offset=".52" stop-color="#c65f77"/>
        <stop offset="1" stop-color="#7f2c43"/>
      </linearGradient>
      <radialGradient id="shine" cx=".32" cy=".25" r=".8">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".34"/>
        <stop offset=".55" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <path d="M64 8C78 8 85 16 94 22c10 6 22 7 26 19 4 12-3 21-4 32-1 12 5 23-4 33-8 10-20 8-31 12-11 4-19 12-31 8-12-4-14-16-22-25-8-9-20-13-20-26 0-12 11-18 16-28 5-11 4-23 15-30C49 10 55 8 64 8Z" fill="url(#wax)"/>
    <path d="M64 8C78 8 85 16 94 22c10 6 22 7 26 19 4 12-3 21-4 32-1 12 5 23-4 33-8 10-20 8-31 12-11 4-19 12-31 8-12-4-14-16-22-25-8-9-20-13-20-26 0-12 11-18 16-28 5-11 4-23 15-30C49 10 55 8 64 8Z" fill="url(#shine)"/>
    <circle cx="64" cy="66" r="35" fill="none" stroke="#6f2438" stroke-width="3" opacity=".45"/>
    <path d="M64 88 40 65c-12-12 5-29 18-16l6 6 6-6c13-13 30 4 18 16L64 88Z" fill="none" stroke="#642337" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}
