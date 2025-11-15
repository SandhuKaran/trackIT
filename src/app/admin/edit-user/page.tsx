"use client";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { AppRouter } from "@/lib/trpc/server";
import type { inferRouterOutputs } from "@trpc/server";

// Import all the UI components
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// This is the type inferred from our new tRPC procedure
type RouterOutputs = inferRouterOutputs<AppRouter>;
type UserForEdit = NonNullable<RouterOutputs["listAllUsers"]>[number];

export default function EditUserPage() {
  const router = useRouter();

  // State for the form
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "EMPLOYEE" | "ADMIN">(
    "CUSTOMER"
  );
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  // State for the searchable dropdown
  const [searchQuery, setSearchQuery] = useState("");
  const [isListVisible, setIsListVisible] = useState(false);

  // tRPC hooks
  const { data: users, isLoading: isLoadingUsers } =
    trpc.listAllUsers.useQuery();

  const updateUser = trpc.updateUser.useMutation({
    onSuccess: (updatedUser) => {
      // Show success toast
      toast.success(`User updated: ${updatedUser.name}`, {
        description: `Their details have been saved successfully.`,
      });
      // Redirect to admin dashboard
      router.push("/admin/dashboard");
    },
    onError: (err) => {
      setError(err.message);
      // You could also show an error toast here
      // toast.error(err.message);
    },
  });

  // Filter users for the dropdown
  const filteredUsers =
    users?.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [];

  function handleUserSelect(user: UserForEdit) {
    // A user was selected from the dropdown
    setSelectedUserId(user.id);
    setName(user.name);
    setEmail(user.email);
    setAddress(user.address ?? ""); // Handle null address
    setRole(user.role);
    setPassword(""); // Clear password field
    setSearchQuery(user.name); // Set input to user's name
    setIsListVisible(false); // Hide the list
    setError(null); // Clear errors
  }

  function handleSubmit() {
    if (!selectedUserId) {
      setError("Please select a user to edit.");
      return;
    }

    setError(null);

    updateUser.mutate({
      userId: selectedUserId,
      name,
      email,
      role,
      address,
      // Only send the password if the string is not empty
      password: password || undefined,
    });
  }

  return (
    <div className="min-h-screen bg-black text-white dark flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Existing User</CardTitle>
          <CardDescription>
            Search for a user to load their details, then make your changes.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          {/* --- Searchable Dropdown --- */}
          <div className="grid gap-2">
            <Label htmlFor="customer-search">Search User</Label>
            <Command
              className="relative overflow-visible"
              filter={() => 1} // We do our own filtering
            >
              <CommandInput
                id="customer-search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onValueChange={(search) => {
                  setSearchQuery(search);
                  if (selectedUserId) setSelectedUserId(null); // Deselect on new search
                  if (!isListVisible) setIsListVisible(true);
                }}
                onFocus={() => setIsListVisible(true)}
                onBlur={() => setTimeout(() => setIsListVisible(false), 150)}
              />
              <CommandList
                className={cn(
                  "absolute top-full z-50 mt-1 w-full rounded-md border bg-black shadow-lg",
                  isListVisible ? "block" : "hidden"
                )}
              >
                {isLoadingUsers && (
                  <div className="p-4 text-center text-sm">Loading...</div>
                )}
                <CommandEmpty>No user found.</CommandEmpty>
                <CommandGroup>
                  {filteredUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.name}
                      onSelect={() => handleUserSelect(user)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedUserId === user.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div>
                        <p>
                          {user.name} ({user.role})
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>

          {/* --- Divider --- */}
          <hr className="border-gray-700" />

          {/* --- Edit Fields (disabled until user is selected) --- */}
          <fieldset
            disabled={!selectedUserId}
            className="grid gap-4 disabled:opacity-50"
          >
            <div className="grid gap-2">
              <Label htmlFor="role-select">User Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger id="role-select" className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, Toronto"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Leave blank to keep unchanged"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </fieldset>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button
            type="button"
            className="w-full"
            disabled={!selectedUserId || updateUser.isPending}
            onClick={handleSubmit}
          >
            {updateUser.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              "Confirm Changes"
            )}
          </Button>

          {/* Show error or success messages */}
          {error && <p className="text-red-600">{error}</p>}
        </CardFooter>
      </Card>
    </div>
  );
}
