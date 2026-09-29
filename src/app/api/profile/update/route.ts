import { forwardProfileAddresses } from "@/lib/profile-addresses-forwarding";
// Compatibility alias. New clients use PATCH /api/profile; never restore legacy clearing semantics.
export function POST(req: Request) {
  return forwardProfileAddresses(req, "/api/profile", "PATCH");
}
