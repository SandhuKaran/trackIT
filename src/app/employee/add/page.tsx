"use client";
import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/lib/cloudinaryUpload";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const serviceOptions = [
  { id: "lawnMowing", label: "Lawn Mowing" },
  { id: "fertilization", label: "Fertilization" },
  { id: "weedControl", label: "Weed Control" },
  { id: "hedging", label: "Hedging" },
  { id: "cleanup", label: "Spring/Fall Cleanup" },
];

export default function AddEntry() {
  const router = useRouter();
  const { data: customers, isLoading } = trpc.listCustomers.useQuery();
  const createVisit = trpc.createVisit.useMutation({
    onSuccess: () => router.push("/employee/dashboard"),
  });

  const [customerId, setCustomerId] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [services, setServices] = useState({
    lawnMowing: false,
    fertilization: false,
    weedControl: false,
    hedging: false,
    cleanup: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isListVisible, setIsListVisible] = useState(false);

  const sortedCustomers = useMemo(() => {
    if (!customers) return [];
    return [...customers].sort((a, b) => a.name.localeCompare(b.name));
  }, [customers]);

  const selectedCustomerName = useMemo(() => {
    return customers?.find((c) => c.id === customerId)?.name;
  }, [customers, customerId]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return sortedCustomers;
    return sortedCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedCustomers, searchQuery]);

  function handleServiceChange(
    serviceId: keyof typeof services,
    checked: boolean | "indeterminate"
  ) {
    if (typeof checked === "boolean") {
      setServices((prev) => ({
        ...prev,
        [serviceId]: checked,
      }));
    }
  }

  const anyServiceChecked = Object.values(services).some((v) => v);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white dark p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  async function handleSubmit() {
    // ... (handleSubmit logic is unchanged) ...
    const checkedLabels = serviceOptions
      .filter((service) => services[service.id as keyof typeof services])
      .map((service) => service.label);

    let finalNote = "";
    if (checkedLabels.length > 0) {
      finalNote += `Services: ${checkedLabels.join(", ")}\n`;
    }

    if (customNote.trim().length > 0) {
      if (finalNote.length > 0) {
        finalNote += "\n";
      }
      finalNote += `Work Notes: ${customNote.trim()}`;
    }

    let photoUrl: string | undefined;
    if (file) {
      setUploading(true);
      photoUrl = await uploadImage(file);
      setUploading(false);
    }

    createVisit.mutate({ customerId, note: finalNote.trim(), photoUrl });
  }

  return (
    <div className="min-h-screen bg-black text-white dark flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Add Visit Entry</CardTitle>
          <CardDescription>Log a new visit for a customer.</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="customer-search">Customer</Label>
            <Command
              // MODIFIED: Add `overflow-visible` to prevent clipping
              className="relative overflow-visible"
              filter={() => 1}
            >
              <CommandInput
                id="customer-search"
                placeholder="Search by name or email..."
                value={
                  selectedCustomerName && !isListVisible
                    ? selectedCustomerName
                    : searchQuery
                }
                onValueChange={(search) => {
                  setSearchQuery(search);
                  if (customerId) setCustomerId("");
                  if (!isListVisible) setIsListVisible(true);
                }}
                onFocus={() => setIsListVisible(true)}
                onBlur={() => setTimeout(() => setIsListVisible(false), 150)}
              />
              <CommandList
                className={cn(
                  // MODIFIED: Increased z-index to `z-50`
                  "absolute top-full z-50 mt-1 w-full rounded-md border bg-black shadow-lg",
                  isListVisible ? "block" : "hidden"
                )}
              >
                <CommandEmpty>No customer found.</CommandEmpty>
                <CommandGroup>
                  {filteredCustomers.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.name}
                      onSelect={() => {
                        setCustomerId(c.id);
                        setSearchQuery(c.name);
                        setIsListVisible(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          customerId === c.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div>
                        <p>{c.name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
          {/* --- END OF MODIFICATION --- */}

          <div className="grid gap-2">
            <Label>Services Performed</Label>
            <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
              {serviceOptions.map((service) => (
                <div key={service.id} className="flex items-center gap-3">
                  <Checkbox
                    id={service.id}
                    checked={services[service.id as keyof typeof services]}
                    onCheckedChange={(checked) =>
                      handleServiceChange(
                        service.id as keyof typeof services,
                        checked
                      )
                    }
                  />
                  <Label htmlFor={service.id} className="font-normal">
                    {service.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note-textarea">Work Notes</Label>
            <Textarea
              id="note-textarea"
              className="h-24"
              placeholder="Additional comments, materials used, etc."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="photo-upload">Photo (Optional)</Label>
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button
            type="button"
            className="w-full"
            disabled={
              !customerId ||
              (!anyServiceChecked && customNote.length < 2) ||
              createVisit.isPending ||
              uploading
            }
            onClick={handleSubmit}
          >
            {(uploading || createVisit.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {uploading
              ? "Uploading…"
              : createVisit.isPending
              ? "Saving…"
              : "Add Entry"}
          </Button>

          {createVisit.error && (
            <p className="text-red-600">{createVisit.error.message}</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
