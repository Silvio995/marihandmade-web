import "server-only";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { z } from "zod";
import {
  requestBackendPrivate,
  type PrivatePath,
} from "@/lib/api/profile-addresses";
import { parsePrivateResponse } from "@/lib/profile-addresses-contracts";
export async function readPrivatePage<T>(
  path: PrivatePath,
  schema: z.ZodType<T>,
): Promise<T> {
  const response = await requestBackendPrivate(path, {
    cookie: cookies().toString(),
  });
  if (response.status === 401) redirect("/login");
  if (response.status === 404) notFound();
  return parsePrivateResponse(response, schema);
}
