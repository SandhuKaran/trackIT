"use client";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { format } from "date-fns";

export default function VisitsByDate() {
  const [date, setDate] = useState<string | null>(null);

  // call runs only when date is chosen
  const visitsQuery = trpc.visitsByDate.useQuery(
    { date: date ? new Date(date) : new Date() },
    { enabled: !!date }
  );

  return (
    <main className="p-6 max-w-lg m-auto space-y-4">
      <h1 className="text-xl font-semibold">Visits by date</h1>

      {/* HTML date input */}
      <input
        type="date"
        className="input"
        value={date ?? ""}
        onChange={(e) => setDate(e.target.value)}
      />

      {visitsQuery.isFetching && <p>Loading…</p>}

      {visitsQuery.data && (
        <ul className="space-y-3">
          {visitsQuery.data.map((v) => (
            <li key={v.id} className="border rounded p-3">
              <p className="text-sm text-gray-600">
                {v.user.email} • {format(new Date(v.date), "h:mm a")}
              </p>
              <p>{v.note}</p>
            </li>
          ))}
          {visitsQuery.data.length === 0 && <p>No visits.</p>}
        </ul>
      )}
    </main>
  );
}
