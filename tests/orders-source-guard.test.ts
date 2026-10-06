// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { it, expect } from "vitest";
const allowed = new Set([
  "src/app/api/orders/[orderId]/pay/route.ts",
  "src/app/api/orders/[orderId]/pay/paypal/route.ts",
  "src/app/api/orders/[orderId]/pay/paypal/capture/route.ts",
  "src/app/api/orders/[orderId]/pay/paypal/sync/route.ts",
  "src/app/api/paypal/webhook/route.ts",
  "src/lib/paypal.ts",
]);
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
it("Web Order delegates exist only in documented payment exceptions", () => {
  const actual = files("src").filter((file) =>
    /\b(?:prisma|tx)\.(?:order|orderItem|inventoryItem|stockMovement|cartItem)\s*\./.test(
      readFileSync(file, "utf8"),
    ),
  );
  expect(actual.filter((file) => !allowed.has(file))).toEqual([]);
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
it("retained payment exceptions never consume stock or Cart", () => {
  for (const file of allowed)
    expect(readFileSync(file, "utf8")).not.toMatch(
      /\.(?:inventoryItem|stockMovement|cartItem)\s*\.|quantityOnHand|quantityReserved|stock:\s*\{/,
    );
});

it("payment allowlist cannot broaden into Order creation or other Order writes", () => {
  for (const file of allowed) {
    const text = readFileSync(file, "utf8");
    const methods = [
      ...text.matchAll(/\b(?:prisma|tx)\.order\.(\w+)\s*\(/g),
    ].map((match) => match[1]);
    expect(
      methods.every(
        (method) =>
          method === (file === "src/lib/paypal.ts" ? "update" : "findUnique"),
      ),
    ).toBe(true);
    expect(text).not.toMatch(
      /(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+"(?:Order|OrderItem|InventoryItem|StockMovement|CartItem)"/i,
    );
    if (file === "src/lib/paypal.ts") {
      const update = [
        ...text.matchAll(/tx\.order\.update\([\s\S]*?data:\s*\{([\s\S]*?)\}/g),
      ];
      expect(update).toHaveLength(1);
      expect(
        [...update[0][1].matchAll(/\b(\w+)\s*:/g)]
          .map((match) => match[1])
          .sort(),
      ).toEqual(["isPaid", "status"]);
    }
  }
});
