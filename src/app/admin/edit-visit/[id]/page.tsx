"use client";
import React, { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter, useParams } from "next/navigation";
import { uploadImage } from "@/lib/cloudinaryUpload";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

// Import UI components
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

// Define service options (same as your add page)
const serviceOptions = [
  { id: "lawnMowing", label: "Lawn Mowing" },
  { id: "fertilization", label: "Fertilization" },
  { id: "weedControl", label: "Weed Control" },
  { id: "hedging", label: "Hedging" },
  { id: "springCleanup", label: "Spring Cleanup" },
  { id: "fallCleanup", label: "Fall Cleanup" },
];

type ServiceState = {
  lawnMowing: boolean;
  fertilization: boolean;
  weedControl: boolean;
  hedging: boolean;
  springCleanup: boolean;
  fallCleanup: boolean;
};

// Helper function to parse the combined note string
function parseVisitNote(note: string): {
  initialServices: ServiceState;
  initialNote: string;
} {
  const noteLines = note.split("\n");
  let servicesLine = "";
  let notesLine = "";

  if (noteLines.length === 2) {
    servicesLine = noteLines[0].replace("Services: ", "");
    notesLine = noteLines[1].replace("Work Notes: ", "");
  } else if (noteLines.length === 1) {
    if (noteLines[0].startsWith("Services: ")) {
      servicesLine = noteLines[0].replace("Services: ", "");
    } else if (noteLines[0].startsWith("Work Notes: ")) {
      notesLine = noteLines[0].replace("Work Notes: ", "");
    } else {
      // It's just a custom note with no prefix
      notesLine = noteLines[0];
    }
  }

  const parsedServices = servicesLine ? servicesLine.split(", ") : [];
  const initialServices = serviceOptions.reduce(
    (acc, opt) => {
      acc[opt.id as keyof ServiceState] = parsedServices.includes(opt.label);
      return acc;
    },
    { ...initialServiceState } // Use a clean initial state
  );

  return { initialServices, initialNote: notesLine };
}

const initialServiceState: ServiceState = {
  lawnMowing: false,
  fertilization: false,
  weedControl: false,
  hedging: false,
  springCleanup: false,
  fallCleanup: false,
};

export default function EditVisitPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>(); // Gets visitId from URL
  const visitId = params?.id;

  // 1. Fetch the visit data
  const { data: visitData, isLoading } = trpc.getVisitById.useQuery(
    { visitId: visitId! },
    {
      enabled: !!visitId, // Only run query if visitId is available
      refetchOnWindowFocus: false, // Don't refetch just for changing tabs
    }
  );

  // 2. Add the update mutation
  const updateVisit = trpc.updateVisit.useMutation({
    onSuccess: (updatedVisit) => {
      toast.success("Visit updated successfully!");
      // Redirect back to the customer's page
      router.push(`/admin/customer/${updatedVisit.userId}`);
    },
    onError: (err) => {
      toast.error("Failed to update visit", { description: err.message });
    },
  });

  // Form state
  const [customNote, setCustomNote] = useState("");
  const [services, setServices] = useState(initialServiceState);
  const [files, setFiles] = useState<File[]>([]); // For NEW files
  const [uploading, setUploading] = useState(false);

  // State for managing existing photos
  const [existingPhotos, setExistingPhotos] = useState(visitData?.photos || []);
  const [photoIdsToDelete, setPhotoIdsToDelete] = useState<string[]>([]);

  // 3. Pre-populate the form once data loads
  useEffect(() => {
    if (visitData) {
      const { initialServices, initialNote } = parseVisitNote(visitData.note);
      setServices(initialServices);
      setCustomNote(initialNote);
      setExistingPhotos(visitData.photos);
    }
  }, [visitData]);

  // --- Photo Management ---
  const newFilePreviews = useMemo(() => {
    return files.map((file) => URL.createObjectURL(file));
  }, [files]);

  const removeNewFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(newFilePreviews[index]);
  };

  // NEW: Mark an existing photo for deletion
  const removeExistingPhoto = (photoId: string) => {
    setPhotoIdsToDelete((prev) => [...prev, photoId]);
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

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

  // 4. Update the submit handler
  async function handleSubmit() {
    if (!visitId) {
      toast.error("Error", {
        description: "Visit ID is missing. Cannot save changes.",
      });
      return; // Stop the function here
    }
    // Re-combine services and note (same as add page)
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

    // Upload NEW photos (same as add page)
    let newPhotoUrls: string[] = [];
    if (files.length > 0) {
      setUploading(true);
      const uploadPromises = files.map((file) => uploadImage(file));
      newPhotoUrls = await Promise.all(uploadPromises);
      setUploading(false);
    }

    // Call the update mutation
    updateVisit.mutate({
      visitId,
      note: finalNote.trim(),
      newPhotoUrls,
      photoIdsToDelete,
    });
  }

  if (isLoading || !visitData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white dark p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white dark flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Visit</CardTitle>
          <CardDescription>
            Editing visit for: {visitData.user.name}
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          {/* Customer name (read-only) */}
          <div className="grid gap-2">
            <Label>Customer</Label>
            <Input value={visitData.user.name} disabled />
          </div>

          {/* Services (same as add page) */}
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

          {/* Work Notes (same as add page) */}
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

          {/* --- Photo Section --- */}

          {/* NEW: Existing Photos */}
          {existingPhotos.length > 0 && (
            <div className="grid gap-2">
              <Label>Existing Photos</Label>
              <div className="grid grid-cols-3 gap-2">
                {existingPhotos.map((photo) => (
                  <div key={photo.id} className="relative">
                    <img
                      src={photo.url.replace(
                        "/upload/",
                        "/upload/w_400,c_fill/"
                      )}
                      alt="Existing photo"
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeExistingPhoto(photo.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Photos (same as add page) */}
          <div className="grid gap-2">
            <Label htmlFor="photo-upload">Add New Photos</Label>
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                }
              }}
              value=""
            />
          </div>

          {/* New File Previews (same as add page) */}
          {newFilePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {newFilePreviews.map((previewUrl, index) => (
                <div key={index} className="relative">
                  <img
                    src={previewUrl}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => removeNewFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button
            type="button"
            className="w-full"
            disabled={
              (!anyServiceChecked && customNote.length < 2) ||
              updateVisit.isPending ||
              uploading
            }
            onClick={handleSubmit}
          >
            {(uploading || updateVisit.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {uploading
              ? "Uploading…"
              : updateVisit.isPending
              ? "Saving Changes…"
              : "Save Changes"}
          </Button>

          {updateVisit.error && (
            <p className="text-red-600">{updateVisit.error.message}</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
