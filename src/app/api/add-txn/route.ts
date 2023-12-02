import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const txnId = searchParams.get("txnId");
  const eventType = searchParams.get("eventType");
  const eventTime = searchParams.get("eventTime");
  const amount = searchParams.get("amount");

  try {
    if (!eventType || !eventTime)
      throw new Error("Type and time required for transactions");
    // await sql`INSERT INTO Transactions (Name, Owner) VALUES (${petName}, ${ownerName});`;
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  const pets = await sql`SELECT * FROM Pets;`;
  return NextResponse.json({ pets }, { status: 200 });
}
