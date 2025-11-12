"use client";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/lib/cloudinaryUpload";

// 💡 FIX: Import all the shadcn/ui components we need
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react"; // 💡 For the loading spinner

export default function AddEntry() {
  const router = useRouter();
  const { data: customers, isLoading } = trpc.listCustomers.useQuery();
  const createVisit = trpc.createVisit.useMutation({
    onSuccess: () => router.push("/employee/dashboard"),
  });

  const [customerId, setCustomerId] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // 💡 FIX: We can wrap the loading state in the dark theme
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white dark p-4">
        <p>Loading customers...</p>
      </div>
    );
  }

  async function handleSubmit() {
    let photoUrl: string | undefined;
    console.log("file state is", file);
    if (file) {
      setUploading(true);
      photoUrl = await uploadImage(file); // 🔼 send to Cloudinary
      setUploading(false);
    }
    createVisit.mutate({ customerId, note, photoUrl });
  }

  return (
    // 💡 FIX: Wrapper div for dark theme and centering
    <div className="min-h-screen bg-black text-white dark flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Add Visit Entry</CardTitle>
          <CardDescription>Log a new visit for a customer.</CardDescription>
        </CardHeader>

        {/* 💡 FIX: CardContent now holds our form fields */}
        <CardContent className="grid gap-4">
          {/* 💡 FIX: Customer dropdown (using grid gap-2 like login) */}
          <div className="grid gap-2">
            <Label htmlFor="customer-select">Customer</Label>
            {/* The new Select component. It hooks into state perfectly. */}
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger id="customer-select" className="w-full">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 💡 FIX: Note textarea */}
          <div className="grid gap-2">
            <Label htmlFor="note-textarea">Work Notes</Label>
            <Textarea
              id="note-textarea"
              className="h-24"
              placeholder="Work done, comments..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* 💡 FIX: Photo upload */}
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
          {/* 💡 FIX: Submit button */}
          <Button
            type="button"
            className="w-full"
            disabled={
              !customerId ||
              note.length < 2 ||
              createVisit.isPending ||
              uploading
            }
            onClick={handleSubmit}
          >
            {/* 💡 FIX: Added loading spinner icon */}
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
              </>
            ) : createVisit.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Add Entry"
            )}
          </Button>

          {createVisit.error && (
            <p className="text-red-600">{createVisit.error.message}</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
