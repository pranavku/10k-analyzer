const ALLOWED_PREFIXES = [
  "https://www.sec.gov/",
  "https://data.sec.gov/",
  "https://efts.sec.gov/",
];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const target = url.searchParams.get("url");

    if (!target) {
      return json({ error: "Missing ?url= parameter" }, 400);
    }

    if (!ALLOWED_PREFIXES.some(p => target.startsWith(p))) {
      return json({ error: "URL not in allowlist" }, 403);
    }

    try {
      const upstream = await fetch(target, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; 10K-Analyzer/1.0)",
          "Accept": "application/json, text/html, */*",
        },
      });

      const body = await upstream.arrayBuffer();
      const ct = upstream.headers.get("Content-Type") || "application/octet-stream";

      return new Response(body, {
        status: upstream.status,
        headers: {
          ...CORS,
          "Content-Type": ct,
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch (err) {
      return json({ error: String(err) }, 500);
    }
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
