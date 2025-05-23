"use client";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddEntry() {
  const router = useRouter();
  const { data: customers, isLoading } = trpc.listCustomers.useQuery();
  const createVisit = trpc.createVisit.useMutation({
    onSuccess: () => router.push("/employee/dashboard"),
  });

  const [customerId, setCustomerId] = useState("");
  const [note, setNote] = useState("");

  if (isLoading) return <p className="p-4">Loading…</p>;

  return (
    <main className="p-6 max-w-lg m-auto space-y-4">
      <h1 className="text-xl font-semibold">Add visit entry</h1>

      {/* Customer dropdown */}
      <select
        className="input w-full"
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
      >
        <option value="">Select customer</option>
        {customers?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.email}
          </option>
        ))}
      </select>

      {/* Note textarea */}
      <textarea
        className="input w-full h-24"
        placeholder="Work done, comments…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {/* Submit */}
      <button
        className="btn w-full"
        disabled={!customerId || note.length < 2 || createVisit.isLoading}
        onClick={() => createVisit.mutate({ customerId, note })}
      >
        {createVisit.isLoading ? "Adding…" : "Add entry"}
      </button>

      {createVisit.error && (
        <p className="text-red-600">{createVisit.error.message}</p>
      )}
    </main>
  );
}
