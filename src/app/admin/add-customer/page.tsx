"use client";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Import all the UI components
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
import { Loader2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddCustomerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "EMPLOYEE" | "ADMIN">(
    "CUSTOMER"
  );
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createCustomer = trpc.createCustomer.useMutation({
    onSuccess: () => {
      // On success, go back to the dashboard
      router.push("/admin/dashboard");
    },
    onError: (err) => {
      // Show any error from the server (like "email already exists")
      setError(err.message);
    },
  });

  function handleSubmit() {
    setError(null); // Clear old errors
    createCustomer.mutate({ name, email, password, role, address });
  }

  return (
    <div className="min-h-screen bg-black text-white dark flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Add New User</CardTitle>
          <CardDescription>
            Create a new account. They will use this email and password to log
            in.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="role-select">User Role</Label>
            <Select
              value={role}
              onValueChange={(value: "CUSTOMER" | "EMPLOYEE" | "ADMIN") =>
                setRole(value)
              }
            >
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
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button
            type="button"
            className="w-full"
            disabled={
              !name || !email || password.length < 8 || createCustomer.isPending
            }
            onClick={handleSubmit}
          >
            {createCustomer.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              "Create User"
            )}
          </Button>

          {/* Show error message if one exists */}
          {error && <p className="text-red-600">{error}</p>}
        </CardFooter>
      </Card>
    </div>
  );
}
