"use client";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";

export default function Dashboard() {
  const { data: customers, isLoading } = trpc.listCustomers.useQuery();

  if (isLoading) return <p className="p-4">Loading…</p>;

  return (
    <main className="p-6 max-w-lg m-auto">
      <h1 className="text-xl font-semibold mb-4">Customers</h1>
      <ul className="space-y-2">
        {customers?.map((c) => (
          <li key={c.id} className="border rounded p-3 flex justify-between">
            <span>{c.email}</span>
            <Link
              href={`/employee/customer/${c.id}`}
              className="text-blue-600 underline"
            >
              View
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
