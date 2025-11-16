"use client";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { VisitCard } from "@/components/ui/VisitCard";

// Import the type definition for a visit
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/lib/trpc/server";
type VisitFromTRPC = inferRouterOutputs<AppRouter>["getVisits"][number];

// Define the props for our new component
interface VisitTimelineProps {
  visits: VisitFromTRPC[];
}

export function VisitTimeline({ visits }: VisitTimelineProps) {
  const [openItems, setOpenItems] = useState<string[]>(() => {
    return visits.length > 0 ? [visits[0].id] : [];
  });
  return (
    <Accordion
      type="multiple"
      className="w-full space-y-4"
      value={openItems}
      onValueChange={setOpenItems}
    >
      {visits.map((visit) => (
        <AccordionItem
          key={visit.id}
          value={visit.id}
          className="rounded-lg border border-gray-700 bg-black shadow-xl overflow-hidden"
        >
          <AccordionTrigger className="px-6 py-4 font-semibold hover:no-underline text-left">
            {/* The trigger is just the date*/}
            <span>
              {new Intl.DateTimeFormat("en-CA", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(visit.date))}
            </span>
          </AccordionTrigger>
          <AccordionContent className="p-0 border-t border-gray-700">
            <VisitCard visit={visit} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
