import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { redirect } from "next/navigation";

import { createContext } from "@/lib/trpc/context";
import { appRouter } from "@/lib/trpc/server";

export default async function Timeline() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login"); // ✔ compile-time import fixed
  }

  // Create caller with the same context the route-handler would use
  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);

  const visits = await caller.getVisits(); // ← type-safe server call

  return (
    <main className="p-4 max-w-lg m-auto">
      <h1 className="text-xl font-semibold mb-4">Your visits</h1>
      <ul className="space-y-3">
        {visits.map((v) => (
          <li key={v.id} className="border rounded p-3">
            <p className="font-medium">
              {new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(
                new Date(v.date)
              )}
            </p>
            <p>{v.note}</p>
            {v.photoUrl && (
              <img src={v.photoUrl} alt="" className="h-24 rounded mt-2" />
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
