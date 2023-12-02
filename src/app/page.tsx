import { formatAmount } from "@/solution";

const sampleInput =
  '{"creditLimit":1000,"events":[{"eventType":"TXN_AUTHED","eventTime":1,"txnId":"t1","amount":123},{"eventType":"TXN_SETTLED","eventTime":2,"txnId":"t1","amount":456},{"eventType":"PAYMENT_INITIATED","eventTime":3,"txnId":"p1","amount":-456}]}';

export default function Home() {
  const { creditLimit, events }: { creditLimit: number; events: EventData[] } =
    JSON.parse(sampleInput);

  const txnMap: { [key: string]: EventData & { eventTimeFinalized: number } } =
    {};
  events.forEach((e) => {
    if (e.eventType === "TXN_AUTHED" || e.eventType === "PAYMENT_INITIATED") {
      txnMap[e.txnId] = { ...e, eventTimeFinalized: 0 };
      return;
    }
    if (e.eventType === "PAYMENT_POSTED" || e.eventType === "TXN_SETTLED") {
      txnMap[e.txnId].eventType = e.eventType;
      txnMap[e.txnId].eventTimeFinalized = e.eventTime;
      if (e.eventType === "TXN_SETTLED") txnMap[e.txnId].amount = e.amount;
      return;
    }

    if (
      e.eventType === "TXN_AUTH_CLEARED" ||
      e.eventType === "PAYMENT_CANCELED"
    ) {
      delete txnMap[e.txnId];
      return;
    }
  });

  let availableCredit = creditLimit;
  let payableBalance = 0;
  const pendingTransactions: (EventData & { eventTimeFinalized: number })[] =
    [];
  const settledTransactions: (EventData & { eventTimeFinalized: number })[] =
    [];

  Object.keys(txnMap).map((txnId) => {
    const txn = txnMap[txnId];

    if (txn.eventType === "TXN_AUTHED") {
      availableCredit -= txn.amount;
      pendingTransactions.push(txn);
    }
    if (txn.eventType === "TXN_SETTLED") {
      availableCredit -= txn.amount;
      payableBalance += txn.amount;
      settledTransactions.push(txn);
    }
    if (txn.eventType === "PAYMENT_INITIATED") {
      payableBalance += txn.amount;
      pendingTransactions.push(txn);
    }
    if (txn.eventType === "PAYMENT_POSTED") {
      availableCredit -= txn.amount;
      payableBalance += txn.amount;
      settledTransactions.push(txn);
    }
  });

  pendingTransactions.sort((a, b) => {
    return b.eventTime - a.eventTime;
  });

  settledTransactions.sort((a, b) => {
    return b.eventTime - a.eventTime;
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

      <div className="pb-6">
        <button
          type="button"
          className="bg-black rounded-full text-gray-50 px-3 py-1.5"
        >
          <span className="text-sm">New transaction</span>
        </button>
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="text-lg">Pending transactions</h3>

          <div className="mt-2 space-y-4">
            {pendingTransactions.map((txn) => (
              <TransactionCard key={txn.txnId} txn={txn} type="pending" />
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-lg">Settled transactions</h3>

          <div className="mt-2 space-y-4">
            {settledTransactions.map((txn) => (
              <TransactionCard key={txn.txnId} txn={txn} type="settled" />
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-lg">History</h3>

          <div className="mt-2 space-y-2">
            {events.map((event, i) => (
              <TransactionHistoryCard
                key={event.eventTime}
                event={event}
                i={i + 1}
              />
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
  txn: EventData & { eventTimeFinalized: number };
  type: string;
}) => {
  return (
    <article className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center justify-between relative">
        <div className="font-medium text-lg md:text-xl bg-gray-50 relative z-20 pr-2">
          {txn.txnId}
        </div>
        <div className="text-lg md:text-xl font-bold bg-gray-50 relative z-20 pl-2">
          {formatAmount(txn.amount)}
        </div>

        <div className="absolute w-full border-dotted border-b-2 border-black -mb-3 z-10" />
      </div>
      <div className="mt-2 space-y-0.5">
        <div className="text-xs md:text-sm">
          Initiated at time {txn.eventTime}
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

const TransactionHistoryCard = ({
  event,
  i,
}: {
  event: EventData;
  i: number;
}) => {
  return (
    <article className="bg-gray-100 p-4 rounded-lg flex items-center">
      <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center mr-4 text-sm md:text-base">
        <span className="text-xs">{i}</span>
      </div>
      <div>
        <span className="font-bold">{event.eventType}</span> for event{" "}
        <span className="font-bold">{event.txnId}</span> with amount{" "}
        <span className="font-bold">{formatAmount(event.amount)}</span>
      </div>
    </article>
  );
};
