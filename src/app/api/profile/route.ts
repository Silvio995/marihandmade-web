import { forwardProfileAddresses } from "@/lib/profile-addresses-forwarding";
export const dynamic = "force-dynamic";
export function GET(req: Request) {
  return forwardProfileAddresses(req, "/api/profile", "GET");
}
export function PATCH(req: Request) {
  return forwardProfileAddresses(req, "/api/profile", "PATCH");
}
