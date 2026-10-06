import "server-only";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import {
  requestBackendOrders,
  OrdersError,
  type OrdersPath,
} from "@/lib/api/orders";
import {
  detailSchema,
  listSchema,
  idSchema,
} from "@/lib/checkout-orders-contracts";
async function read(path: OrdersPath, query?: string) {
  try {
    return (
      await requestBackendOrders(path, { cookie: cookies().toString(), query })
    ).body;
  } catch (error) {
    if (error instanceof OrdersError && error.status === 401)
      redirect("/login");
    if (error instanceof OrdersError && error.status === 404) notFound();
    throw error;
  }
}
export async function readOrder(id: string) {
  if (!idSchema.safeParse(id).success) notFound();
  return detailSchema.parse(
    await read(`/api/orders/${encodeURIComponent(id)}`),
  );
}
export async function readOrders(cursor?: string) {
  return listSchema.parse(
    await read(
      "/api/orders",
      new URLSearchParams({
        limit: "20",
        ...(cursor ? { cursor } : {}),
      }).toString(),
    ),
  );
}
