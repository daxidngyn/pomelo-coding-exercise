"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";

export async function createTransaction(formData: FormData) {
  const eventType = formData.get("eventType");
  const amount = formData.get("amount");
  const time = formData.get("time");
  let txnId = formData.get("txnId");

  if (
    (eventType === "PAYMENT_POSTED" ||
      eventType === "TXN_SETTLED" ||
      eventType === "TXN_AUTH_CLEARED" ||
      eventType === "PAYMENT_CANCELED") &&
    !txnId
  ) {
    throw new Error("Must provide a valid transaction id!");
  }

  if (
    eventType === "PAYMENT_CANCELED" ||
    eventType === "TXN_AUTH_CLEARED" ||
    eventType === "PAYMENT_POSTED"
  ) {
    await sql`
        INSERT INTO Events (TxnId, EventType, EventTime)
        VALUES (${txnId}, ${eventType}, ${time})
      `;

    revalidatePath("/");
    return;
  }

  // get next id
  if (eventType === "TXN_AUTHED" || eventType === "PAYMENT_INITIATED") {
    const { rows } = await sql`
        SELECT DISTINCT TxnId
        FROM Events
        ORDER BY TxnId
    `;
    if (eventType === "TXN_AUTHED") {
      const transactions = rows.filter((txn) => txn.txnid.startsWith("t"));
      txnId = `t${transactions.length}`;
    }
    if (eventType === "PAYMENT_INITIATED") {
      const payments = rows.filter((txn) => txn.txnid.startsWith("p"));
      txnId = `p${payments.length}`;
    }
  }

  console.log(eventType, amount, time, txnId);

  await sql`
        INSERT INTO Events (TxnId, EventType, EventTime, Amount)
        VALUES (${txnId}, ${eventType}, ${time}, ${amount})
      `;

  revalidatePath("/");
}
