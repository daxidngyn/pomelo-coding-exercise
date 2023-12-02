// copied over solution from HackerRank

export const formatAmount = (amnt: number) => {
  if (amnt >= 0) return `$${amnt}`;

  return `-$${Math.abs(amnt)}`;
};

const formatSummary = (
  txn: EventData & { eventTimeFinalized: number }
): string => {
  const formatAmount = (amnt: number) => {
    if (txn.amount >= 0) return `$${amnt}`;

    return `-$${Math.abs(amnt)}`;
  };

  if (txn.eventType === "TXN_AUTHED" || txn.eventType === "PAYMENT_INITIATED") {
    return `${txn.txnId}: ${formatAmount(txn.amount)} @ time ${txn.eventTime}`;
  }

  return `${txn.txnId}: ${formatAmount(txn.amount)} @ time ${
    txn.eventTime
  } (finalized @ time ${txn.eventTimeFinalized})`;
};

const buildOutput = (
  availableCredit: number,
  payableBalance: number,
  pendingTxns: (EventData & { eventTimeFinalized: number })[],
  settledTxns: (EventData & { eventTimeFinalized: number })[]
) => {
  const availableCreditOutput = `Available credit: $${availableCredit}\n`;
  const payableBalanceOutput = `Payable balance: $${payableBalance}\n`;

  let pendingTxnsOutput = "Pending transactions:\n";
  pendingTxns.forEach((txn, i) => {
    pendingTxnsOutput += `${formatSummary(txn)}\n`;
  });

  let settledTxnsOutput = "Settled transactions:\n";
  settledTxns.forEach((txn, i) => {
    if (i === settledTxns.length - 1) {
      settledTxnsOutput += `${formatSummary(txn)}`;
      return;
    }

    settledTxnsOutput += `${formatSummary(txn)}\n`;
  });

  return `${availableCreditOutput}${payableBalanceOutput}\n${pendingTxnsOutput}\n${settledTxnsOutput}`;
};

const summarize = (inputJSON: string) => {
  const { creditLimit, events }: { creditLimit: number; events: EventData[] } =
    JSON.parse(inputJSON);

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

  const output = buildOutput(
    availableCredit,
    payableBalance,
    pendingTransactions,
    settledTransactions
  );

  return output;
};
