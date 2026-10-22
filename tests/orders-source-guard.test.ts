// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { it, expect } from "vitest";
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.name === "generated"
      ? []
      : e.isDirectory()
        ? files(join(dir, e.name))
        : /\.[jt]sx?$/.test(e.name)
          ? [join(dir, e.name)]
          : [],
  );
}
it("Web has no active payment/order persistence delegates", () => {
  const actual = files("src").filter((file) =>
    /\b(?:prisma|tx)\.(?:payment|paymentProvider|order|orderItem|inventoryItem|stockMovement|cartItem)\s*\./.test(
      readFileSync(file, "utf8"),
    ),
  );
  expect(actual).toEqual([]);
});
it("migrated checkout/history/detail modules have no Prisma imports", () => {
  for (const file of [
    "src/app/api/checkout/route.ts",
    "src/app/api/orders/route.ts",
    "src/app/api/orders/[orderId]/route.tsx",
    "src/app/(store)/(routes)/profile/orders/page.tsx",
    "src/app/(store)/(routes)/profile/orders/[orderId]/page.tsx",
    "src/lib/server-orders.ts",
  ]) {
    expect(readFileSync(file, "utf8")).not.toMatch(
      /lib\/prisma|generated\/client/,
    );
  }
});
it("payment modules contain no provider, DB or guest signing ownership", () => {
  const paths = files("src").filter((file) =>
    /pay(?:ment|pal)|orders.*pay/.test(file),
  );
  for (const file of paths)
    expect(readFileSync(file, "utf8")).not.toMatch(
      /lib\/prisma|generated\/client|PAYPAL_CLIENT_SECRET|client_credentials|api-m\.paypal|api-m\.sandbox|reconcilePayPalPayment|createHmac|GUEST_ORDER_TOKEN_SECRET/,
    );
  expect(readFileSync("src/lib/auth.ts", "utf8")).not.toMatch(
    /createHmac|GUEST_ORDER_TOKEN_SECRET|GuestOrderAccess/,
  );
});
