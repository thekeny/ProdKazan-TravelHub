import type { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/backend-proxy";

async function handler(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyBackend(request, (await context.params).path);
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
