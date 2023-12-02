import TransactionModal from "@/components/TransactionModal";
import { formatAmount } from "@/solution";
import { sql } from "@vercel/postgres";

const getAllEvents = async () => {
  const entries = await sql`
    SELECT EventType, EventTime, TxnId, Amount
    FROM Events
    ORDER BY EventTime
  `;

  return entries.rows;
};

const CREDIT_LIMIT = 1000;

type NewEventData = {
  eventtype: string;
  eventtime: number;
  txnid: string;
  amount: number;
};

export default async function Home() {
  const summarize = () => {
    const txnMap: {
      [key: string]: NewEventData & { eventTimeFinalized: number };
    } = {};

    events.forEach((e) => {
      if (e.eventtype === "TXN_AUTHED" || e.eventtype === "PAYMENT_INITIATED") {
        txnMap[e.txnid] = { ...e, eventTimeFinalized: 0 };
        return;
      }
      if (e.eventtype === "PAYMENT_POSTED" || e.eventtype === "TXN_SETTLED") {
        txnMap[e.txnid].eventtype = e.eventtype;
        txnMap[e.txnid].eventTimeFinalized = e.eventtime;
        if (e.eventtype === "TXN_SETTLED") txnMap[e.txnid].amount = e.amount;
        return;
      }

      if (
        e.eventtype === "TXN_AUTH_CLEARED" ||
        e.eventtype === "PAYMENT_CANCELED"
      ) {
        delete txnMap[e.txnid];
        return;
      }
    });

    let availableCredit = CREDIT_LIMIT;
    let payableBalance = 0;
    const pendingTransactions: (NewEventData & {
      eventTimeFinalized: number;
    })[] = [];
    const settledTransactions: (NewEventData & {
      eventTimeFinalized: number;
    })[] = [];

    Object.keys(txnMap).forEach((txnid) => {
      const txn = txnMap[txnid];

      if (txn.eventtype === "TXN_AUTHED") {
        availableCredit -= txn.amount;
        pendingTransactions.push(txn);
      }
      if (txn.eventtype === "TXN_SETTLED") {
        availableCredit -= txn.amount;
        payableBalance += txn.amount;
        settledTransactions.push(txn);
      }
      if (txn.eventtype === "PAYMENT_INITIATED") {
        payableBalance += txn.amount;
        pendingTransactions.push(txn);
      }
      if (txn.eventtype === "PAYMENT_POSTED") {
        availableCredit -= txn.amount;
        payableBalance += txn.amount;
        settledTransactions.push(txn);
      }
    });

    pendingTransactions.sort((a, b) => {
      return b.eventtime - a.eventtime;
    });

    settledTransactions.sort((a, b) => {
      return b.eventtime - a.eventtime;
    });

    return {
      availableCredit,
      payableBalance,
      pendingTransactions,
      settledTransactions,
    };
  };

  const events = (await getAllEvents()) as NewEventData[];

  const {
    availableCredit,
    payableBalance,
    pendingTransactions,
    settledTransactions,
  } = summarize();

  const transactionIds: string[] = [];
  const paymentIds: string[] = [];
  const blacklistedIds: string[] = [];

  events.forEach((e: NewEventData) => {
    const { txnid, eventtype } = e;
    if (
      transactionIds.includes(txnid) ||
      paymentIds.includes(txnid) ||
      blacklistedIds.includes(txnid)
    )
      return;

    if (eventtype === "TXN_AUTH_CLEARED" || eventtype === "PAYMENT_CANCELED") {
      blacklistedIds.push(txnid);

      if (transactionIds.includes(txnid)) {
        const i = transactionIds.indexOf(txnid);
        transactionIds.splice(i, 1);
      }
      if (paymentIds.includes(txnid)) {
        const i = paymentIds.indexOf(txnid);
        paymentIds.splice(i, 1);
      }
    }

    if (txnid.startsWith("t")) transactionIds.push(txnid);
    if (txnid.startsWith("p")) paymentIds.push(txnid);
  });

  return (
    <main className="flex min-h-screen flex-col">
      <div className="pb-2">
        <h1 className="text-2xl font-semibold">Pomelo Coding Exercise 2023</h1>
        <div className="flex flex-col sm:flex-row items-baseline justify-between">
          <h2 className="text-lg text-gray-600 font-medium">
            Credit Card Summarizer
          </h2>
          <span className="text-xs font-bold text-gray-600 mt-1 sm:mt-0">
            Created by David Nguyen
          </span>
        </div>
        <hr className="my-1" />
      </div>

      <div className="pb-6 flex flex-col sm:flex-row sm:items-center justify-between">
        <div className="order-2 mt-2 sm:mt-0 sm:order-1">
          <p className="">
            Available credit:{" "}
            <span className=" font-bold">{formatAmount(availableCredit)}</span>
          </p>
          <p className="">
            Payable balance:{" "}
            <span className=" font-bold">{formatAmount(payableBalance)}</span>
          </p>
        </div>

        <div className="order-1 sm:order-2">
          <TransactionModal
            transactionIds={transactionIds}
            paymentIds={paymentIds}
          />
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="text-lg font-medium">Pending transactions</h3>

          <div className="mt-2 space-y-4">
            {pendingTransactions.map((txn) => (
              <TransactionCard key={txn.txnid} txn={txn} type="pending" />
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium">Settled transactions</h3>

          <div className="mt-2 space-y-4">
            {settledTransactions.map((txn) => (
              <TransactionCard key={txn.txnid} txn={txn} type="settled" />
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium">Events</h3>

          <div className="mt-2 space-y-2">
            {events.map((event, i) => (
              <EventCard key={event.eventtime} event={event} i={i + 1} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

const TransactionCard = ({
  txn,
  type,
}: {
  txn: NewEventData & { eventTimeFinalized: number };
  type: string;
}) => {
  return (
    <article className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center justify-between relative">
        <div className="font-medium text-lg md:text-xl bg-gray-50 relative z-20 pr-2">
          {txn.txnid}
        </div>
        <div className="text-lg md:text-xl font-bold bg-gray-50 relative z-20 pl-2">
          {formatAmount(txn.amount)}
        </div>

        <div className="absolute w-full border-dotted border-b-2 border-black -mb-3 z-10" />
      </div>
      <div className="mt-2 space-y-0.5">
        <div className="text-xs md:text-sm">
          Initiated at time {txn.eventtime}
        </div>

        {type === "settled" ? (
          <div className="text-xs md:text-sm">
            Finalized at time {txn.eventTimeFinalized}
          </div>
        ) : null}
      </div>
    </article>
  );
};

const EventCard = ({ event, i }: { event: NewEventData; i: number }) => {
  return (
    <article className="bg-gray-100 p-4 rounded-lg flex items-center">
      <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center mr-4 text-sm md:text-base">
        <span className="text-xs">{i}</span>
      </div>
      <p>
        <span className="font-bold">{event.eventtype}</span> for event{" "}
        <span className="font-bold">{event.txnid}</span>{" "}
        {event.eventtype !== "TXN_AUTH_CLEARED" &&
          event.eventtype !== "PAYMENT_CANCELED" &&
          event.eventtype !== "PAYMENT_POSTED" && (
            <span>
              with amount{" "}
              <span className="font-bold">{formatAmount(event.amount)}</span>
            </span>
          )}
      </p>
    </article>
  );
};
