import { forwardProfileAddresses } from "@/lib/profile-addresses-forwarding";
export const dynamic = "force-dynamic";
type Context = { params: { addressId: string } };
export function GET(req: Request, { params }: Context) {
  return forwardProfileAddresses(
    req,
    `/api/addresses/${encodeURIComponent(params.addressId)}`,
    "GET",
  );
}
export function PATCH(req: Request, { params }: Context) {
  return forwardProfileAddresses(
    req,
    `/api/addresses/${encodeURIComponent(params.addressId)}`,
    "PATCH",
  );
}
export function DELETE(req: Request, { params }: Context) {
  return forwardProfileAddresses(
    req,
    `/api/addresses/${encodeURIComponent(params.addressId)}`,
    "DELETE",
  );
}
