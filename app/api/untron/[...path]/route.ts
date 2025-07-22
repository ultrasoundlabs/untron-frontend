import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_BASE = "https://api.untron.finance/functions/v1";

function buildUpstreamUrl(pathSegments: string[], search: string) {
  const joined = pathSegments.join("/");
  return `${UPSTREAM_BASE}/${joined}${search}`;
}

export async function GET(req: NextRequest, {
  params,
}: {
  params: { path: string[] };
}) {
  const upstream = buildUpstreamUrl(params.path, new URL(req.url).search);
  const resp = await fetch(upstream, {
    method: "GET",
    // pass along no-cache to avoid stale data during polling
    headers: { "cache-control": "no-store" },
  });
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: { "content-type": resp.headers.get("content-type") || "application/json" },
  });
}

export async function POST(req: NextRequest, {
  params,
}: {
  params: { path: string[] };
}) {
  const upstream = buildUpstreamUrl(params.path, "");
  const body = await req.text();
  const resp = await fetch(upstream, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: { "content-type": resp.headers.get("content-type") || "application/json" },
  });
} 