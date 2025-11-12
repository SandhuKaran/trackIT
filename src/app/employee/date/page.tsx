"use client";
import { trpc } from "@/lib/trpc/client";
import React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function VisitsByDate() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  const visitsQuery = trpc.visitsByDate.useQuery(
    { date: date as Date },
    { enabled: !!date }
  );

  return (
    <div className="min-h-screen bg-black text-white dark">
      <main className="p-4 max-w-lg m-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center pt-6">
          Visits by Date
        </h1>

        {/* --- Date Picker --- */}
        <div className="flex flex-col items-center gap-3">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  setDate(newDate);
                  setOpen(false);
                }}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* --- Results --- */}
        {visitsQuery.isFetching && <p className="text-center">Loading...</p>}

        {date && !visitsQuery.isFetching && (
          <div className="space-y-4">
            {visitsQuery.data?.map((v) => (
              <Card key={v.id} className="shadow-xl">
                <CardHeader>
                  <CardDescription className="flex justify-between">
                    <span>{v.user.name}</span>
                    <span>{format(new Date(v.date), "h:mm a")}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>{v.note}</p>

                  {v.photoUrl && (
                    <a
                      href={v.photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-md overflow-hidden"
                    >
                      <img
                        src={v.photoUrl.replace(
                          "/upload/",
                          "/upload/w_400,c_fill/"
                        )}
                        alt="Visit photo"
                        className="w-full h-auto object-cover"
                      />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}

            {visitsQuery.data?.length === 0 && (
              <Card>
                <CardContent>
                  <p className="pt-6 text-center text-gray-400">
                    No visits found for this date.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
