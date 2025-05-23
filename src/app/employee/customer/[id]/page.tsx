"use client";
import { trpc } from "@/lib/trpc/client";
import { useParams } from "next/navigation";

export default function CustomerTimeline() {
  const { id } = useParams<{ id: string }>();
  const { data: visits, isLoading } = trpc.visitsByCustomer.useQuery({
    customerId: id,
  });

  if (isLoading) return <p className="p-4">Loading…</p>;

  return (
    <main className="p-6 max-w-lg m-auto">
      <h1 className="text-xl font-semibold mb-4">Visit history</h1>
      <ul className="space-y-3">
        {visits?.map((v) => (
          <li key={v.id} className="border rounded p-3">
            <p className="font-medium">
              {new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(
                new Date(v.date)
              )}
            </p>
            <p>{v.note}</p>
            {v.photoUrl && (
              <img src={v.photoUrl} alt="" className="h-24 mt-2 rounded" />
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
