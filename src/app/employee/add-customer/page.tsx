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

export default function AddCustomerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createCustomer = trpc.createCustomer.useMutation({
    onSuccess: () => {
      // On success, go back to the dashboard
      router.push("/employee/dashboard");
    },
    onError: (err) => {
      // Show any error from the server (like "email already exists")
      setError(err.message);
    },
  });

  function handleSubmit() {
    setError(null); // Clear old errors
    createCustomer.mutate({ name, email, password });
  }

  return (
    <div className="min-h-screen bg-black text-white dark flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Add New Customer</CardTitle>
          <CardDescription>
            Create a new customer account. They will use this email and password
            to log in.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
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
            <Label htmlFor="password">Temporary Password</Label>
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
              "Create Customer"
            )}
          </Button>

          {/* Show error message if one exists */}
          {error && <p className="text-red-600">{error}</p>}
        </CardFooter>
      </Card>
    </div>
  );
}
