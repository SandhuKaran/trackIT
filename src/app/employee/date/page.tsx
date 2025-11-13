"use client";
import { trpc } from "@/lib/trpc/client";
import React from "react";
// MODIFIED: Import `parse` for robust date string conversion
import { format, subDays, addDays, isSameDay, parse } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeVisitCard } from "@/components/ui/EmployeeVisitCard";
import { cn } from "@/lib/utils";

/**
 * Renders a list of visits for a given date.
 * Used inside the tabs.
 */
function VisitList({ date }: { date: Date }) {
  const { data: visits, isFetching } = trpc.visitsByDate.useQuery({ date });

  if (isFetching) {
    return (
      <div className="flex justify-center items-center pt-10">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (visits?.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="pt-6 text-center text-gray-400">
            No visits found for this date.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {visits?.map((v) => (
        <EmployeeVisitCard key={v.id} visit={v} />
      ))}
    </div>
  );
}

export default function VisitsByDate() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date>(new Date()); // Default to today
  const [viewedMonth, setViewedMonth] = React.useState<Date>(date);

  const yesterday = subDays(date, 1);
  const tomorrow = addDays(date, 1);

  // Store the date format string to ensure consistency
  const dateFormat = "yyyy-MM-dd"; // <-- NEW

  const formatTabDate = (d: Date) => {
    const today = new Date();
    if (isSameDay(d, today)) return "Today";
    if (isSameDay(d, subDays(today, 1))) return "Yesterday";
    if (isSameDay(d, addDays(today, 1))) return "Tomorrow";
    return format(d, "MMM d");
  };

  // NEW: Handler for when a tab is clicked
  const handleTabChange = (value: string) => {
    // Parse the date string (e.g., "2025-11-12") back into a Date object
    // We use `parse` from date-fns for a robust, timezone-safe conversion.
    const newDate = parse(value, dateFormat, new Date());
    setDate(newDate);
    setViewedMonth(newDate);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setViewedMonth(date); // Reset to the selected date
    }
    setOpen(isOpen);
  };

  return (
    <div className="min-h-screen bg-black text-white dark">
      <main className="p-4 max-w-lg m-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center pt-6">
          Visits by Date
        </h1>

        {/* --- Date Picker --- */}
        <div className="flex flex-col items-center gap-3">
          <Popover open={open} onOpenChange={handleOpenChange}>
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
                month={viewedMonth} // NEW: Control the displayed month
                onMonthChange={setViewedMonth} // NEW: Allow user to change month
                onSelect={(newDate) => {
                  if (newDate) {
                    setDate(newDate);
                    setViewedMonth(newDate); // NEW: Update viewed month on select
                  }
                  setOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* --- 3-TAB LAYOUT (Now Dynamic) --- */}
        <Tabs
          // MODIFIED: Use the consistent date format
          defaultValue={format(date, dateFormat)}
          key={date.toString()} // This key is crucial for re-rendering
          className="w-full"
          // NEW: Add the onValueChange handler
          onValueChange={handleTabChange}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value={format(yesterday, dateFormat)}>
              {formatTabDate(yesterday)}
            </TabsTrigger>
            <TabsTrigger value={format(date, dateFormat)}>
              {formatTabDate(date)}
            </TabsTrigger>
            <TabsTrigger value={format(tomorrow, dateFormat)}>
              {formatTabDate(tomorrow)}
            </TabsTrigger>
          </TabsList>

          {/* These content sections will now be for the *new* dates */}
          <TabsContent value={format(yesterday, dateFormat)} className="mt-4">
            <VisitList date={yesterday} />
          </TabsContent>
          <TabsContent value={format(date, dateFormat)} className="mt-4">
            <VisitList date={date} />
          </TabsContent>
          <TabsContent value={format(tomorrow, dateFormat)} className="mt-4">
            <VisitList date={tomorrow} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
