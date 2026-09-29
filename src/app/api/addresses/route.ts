import { forwardProfileAddresses } from "@/lib/profile-addresses-forwarding";
export const dynamic = "force-dynamic";
export function GET(req: Request) {
  return forwardProfileAddresses(req, "/api/addresses", "GET");
}
export function POST(req: Request) {
  return forwardProfileAddresses(req, "/api/addresses", "POST");
}
