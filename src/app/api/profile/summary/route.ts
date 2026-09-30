import { requestBackendCart } from "@/lib/api/cart";
import { cartDtoSchema } from "@/lib/cart-contracts";
import { requestBackendPrivate } from "@/lib/api/profile-addresses";
import { requestBackendAuth, getSetCookies } from "@/lib/api/auth";
import { authSessionSchema } from "@/lib/auth-contracts";
import {
  profileSchema,
  addressSchema,
  parsePrivateResponse,
} from "@/lib/profile-addresses-contracts";
import { readAccountAggregates } from "@/lib/transitional-account-aggregates";
import { privateFailure } from "@/lib/profile-addresses-forwarding";
export const dynamic = "force-dynamic";
// Explicit compatibility aggregate for the existing User/Cart providers.
export async function GET(req: Request) {
  try {
    const cookie = req.headers.get("cookie");
    const origin = req.headers.get("origin");
    const auth = await requestBackendAuth("me", { cookie, origin });
    const headers = new Headers({
      "Cache-Control": "no-store",
      Vary: "Cookie",
    });
    for (const value of auth.cookies) headers.append("Set-Cookie", value);
    if (auth.status !== 200)
      return Response.json(auth.body, { status: auth.status, headers });
    const session = authSessionSchema.parse(auth.body);
    const [profileResponse, addressResponse, cartResponse] = await Promise.all([
      requestBackendPrivate("/api/profile", { cookie, origin }),
      requestBackendPrivate("/api/addresses", { cookie, origin }),
      requestBackendCart({ cookie, origin }),
    ]);
    for (const value of [
      ...getSetCookies(profileResponse.headers),
      ...getSetCookies(addressResponse.headers),
      ...getSetCookies(cartResponse.headers),
    ])
      headers.append("Set-Cookie", value);
    for (const response of [profileResponse, addressResponse, cartResponse]) {
      if (!response.ok)
        return new Response(await response.arrayBuffer(), {
          status: response.status,
          headers: new Headers([
            ...headers,
            [
              "Content-Type",
              response.headers.get("content-type") || "application/json",
            ],
          ]),
        });
    }
    const profile = await parsePrivateResponse(profileResponse, profileSchema);
    const addresses = await parsePrivateResponse(
      addressResponse,
      addressSchema.array(),
    );
    const cartDto = cartDtoSchema.parse(await cartResponse.json());
    if (cartDto.userId !== session.user.id) return privateFailure();
    const cart =
      cartDto.createdAt === null && !cartDto.items.length ? null : cartDto;
    const aggregates = await readAccountAggregates(session.user.id);
    return Response.json(
      { ...profile, addresses, cart, ...aggregates },
      { headers },
    );
  } catch {
    return privateFailure();
  }
}
