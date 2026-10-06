import { NextRequest } from "next/server";
import { proxyTeHiceEstoOrder } from "@/lib/tehiceesto-order-proxy";

export async function POST(request:NextRequest){
  return proxyTeHiceEstoOrder(request);
}
