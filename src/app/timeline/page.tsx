import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { redirect } from "next/navigation";
import { createContext } from "@/lib/trpc/context";
import { appRouter } from "@/lib/trpc/server"; // This should be src/lib/trpc/router

// Import Card components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

export default async function Timeline() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);

  const visits = await caller.getVisits();

  return (
    // Wrapper div to match the dark theme from login
    <div className="min-h-screen bg-black text-white dark">
      <main className="p-4 max-w-lg m-auto">
        {/* Styled the title to be more prominent */}
        <h1 className="text-2xl font-semibold mb-6 text-center pt-6">
          Your Visits
        </h1>

        {/* Replaced <ul> with a <div> and added more spacing */}
        <div className="space-y-4">
          {visits.map((v) => (
            // Replaced <li> with <Card>
            <Card key={v.id} className="shadow-xl">
              <CardHeader>
                {/* Placed the date in the header as a description */}
                <CardDescription>
                  {new Intl.DateTimeFormat("en-CA", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(v.date))}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* The note text */}
                <p>{v.note}</p>

                {/* Clickable, full-width image */}
                {v.photoUrl && (
                  <a
                    href={v.photoUrl} // <-- The link is the FULL-RES original image
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-md overflow-hidden" // Makes the link a block for layout
                  >
                    <img
                      src={v.photoUrl.replace(
                        "/upload/",
                        "/upload/w_400,c_fill/" // <-- Thumbnail (made it a bit larger)
                      )}
                      alt="Visit photo" // <-- Added alt text for accessibility
                      className="w-full h-auto object-cover" // Ensures image fills the card width
                    />
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
