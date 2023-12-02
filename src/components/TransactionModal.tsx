"use client";

import { createTransaction } from "@/app/actions";
import { useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";

const eventTypes = [
  "TXN_AUTHED",
  "PAYMENT_INITIATED",
  "PAYMENT_POSTED",
  "TXN_SETTLED",
  "TXN_AUTH_CLEARED",
  "PAYMENT_CANCELED",
];

export default function TransactionModal({
  transactionIds,
  paymentIds,
}: {
  transactionIds: string[];
  paymentIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [eventType, setEventType] = useState("");
  const CheckTxnAssociation = () => {
    if (
      !transactionIds.length &&
      eventType.startsWith("TXN") &&
      eventType !== "TXN_AUTHED"
    ) {
      return (
        <span className="text-xs text-red-400">
          You don{"'"}t have any transactions yet!
        </span>
      );
    }

    if (
      !paymentIds.length &&
      eventType.startsWith("PAYMENT") &&
      eventType !== "PAYMENT_INITIATED"
    ) {
      return (
        <span className="text-xs text-red-400">
          You don{"'"}t have any payments yet!
        </span>
      );
    }

    if (
      eventType === "PAYMENT_POSTED" ||
      eventType === "TXN_SETTLED" ||
      eventType === "TXN_AUTH_CLEARED" ||
      eventType === "PAYMENT_CANCELED"
    ) {
      return (
        <div className="flex flex-col">
          <label htmlFor="eventType" className="text-sm">
            Select a transaction id for this event:
          </label>
          <select
            name="txnId"
            id="txnId"
            className="p-2 bg-gray-100 rounded-md mt-1 text-sm"
          >
            {eventType.startsWith("TXN") ? (
              <>
                {transactionIds.map((txnid) => (
                  <option key={txnid} value={txnid}>
                    {txnid}
                  </option>
                ))}
              </>
            ) : (
              <>
                {paymentIds.map((txnid) => (
                  <option key={txnid} value={txnid}>
                    {txnid}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
      );
    }

    return null;
  };

  return (
    <DialogTrigger>
      <Button
        onPress={() => setOpen(true)}
        type="button"
        className="bg-black rounded-full text-gray-50 px-3 py-1.5 w-full sm:w-auto"
      >
        <span className="text-sm">New transaction</span>
      </Button>
      <ModalOverlay
        isDismissable
        isOpen={open}
        onOpenChange={setOpen}
        className={({ isEntering, isExiting }) => `
           fixed inset-0 z-50 overflow-y-auto bg-black/25 flex min-h-full items-center justify-center p-4 text-center backdrop-blur
          ${isEntering ? "animate-in fade-in duration-300 ease-out" : ""}
          ${isExiting ? "animate-out fade-out duration-200 ease-in" : ""}
        `}
      >
        <Modal
          className={({ isEntering, isExiting }) => `
            w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl
            ${isEntering ? "animate-in zoom-in-95 ease-out duration-300" : ""}
            ${isExiting ? "animate-out zoom-out-95 ease-in duration-200" : ""}
          `}
        >
          <Dialog role="alertdialog" className="outline-none relative">
            {({ close }) => (
              <>
                <Heading
                  slot="title"
                  className="text-lg font-semibold leading-6 my-0 text-slate-700"
                >
                  Create transaction
                </Heading>
                <div className="w-5 h-5 absolute right-0 top-0 stroke-2">
                  <Button onPress={close}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </Button>
                </div>

                <form
                  ref={formRef}
                  className="mt-4 space-y-4"
                  action={async (formData) => {
                    await createTransaction(formData);
                    formRef.current?.reset();
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <label htmlFor="eventType" className="text-sm">
                      Select an event type:
                    </label>
                    <select
                      name="eventType"
                      id="eventType"
                      className="p-2 bg-gray-100 rounded-md mt-1 text-sm"
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                    >
                      {eventTypes.map((eventType) => (
                        <option key={eventType} value={eventType}>
                          {eventType}
                        </option>
                      ))}
                    </select>
                  </div>

                  <CheckTxnAssociation />

                  <div className="flex flex-col">
                    <label htmlFor="time" className="text-sm">
                      Enter a time:
                    </label>
                    <input
                      id="time"
                      name="time"
                      type="number"
                      placeholder="1"
                      className="bg-gray-100 py-1 px-2 rounded-md text-sm"
                    />
                  </div>

                  {eventType !== "PAYMENT_CANCELED" &&
                    eventType !== "TXN_AUTH_CLEARED" &&
                    eventType !== "PAYMENT_POSTED" && (
                      <div className="flex flex-col">
                        <label htmlFor="amount" className="text-sm">
                          Enter an amount:
                        </label>
                        <div className="bg-gray-100 py-1 px-3 rounded-md flex items-center focus-within:outline outline-2">
                          <span>$</span>
                          <input
                            id="amount"
                            name="amount"
                            placeholder="0"
                            type="number"
                            className="bg-gray-100 rounded-md w-full focus:outline-none px-1 text-sm"
                          />
                        </div>
                      </div>
                    )}

                  <div className="mt-6 flex justify-end gap-2">
                    <Button onPress={close}>Cancel</Button>
                    <Button type="submit">Create</Button>
                  </div>
                </form>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}
