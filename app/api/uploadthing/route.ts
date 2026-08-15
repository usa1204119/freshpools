import { createRouteHandler } from "uploadthing/next";
import { fileRouter, uploadthingConfigured } from "@/lib/uploadthing";

export const runtime = "nodejs";

/**
 * Only mounted when UPLOADTHING_TOKEN exists. Without it the handler would
 * throw on construction and 500 the route, so we return a clear 503 instead —
 * the profile form already falls back to URL fields in that case.
 */
function unavailable() {
  return Response.json(
    { error: "File uploads are not configured on this deployment." },
    { status: 503 },
  );
}

const handlers = uploadthingConfigured
  ? createRouteHandler({ router: fileRouter })
  : { GET: unavailable, POST: unavailable };

export const GET = handlers.GET;
export const POST = handlers.POST;
