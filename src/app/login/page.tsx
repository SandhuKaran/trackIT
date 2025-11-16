"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handle(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    setError(null); // Clear any old errors

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      // Check the result
      if (result && !result.ok) {
        // We got an error, show it
        setError("Sign in failed. Check the details you provided are correct.");
      } else {
        // Success! Manually redirect to the callbackUrl
        router.push("/");
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white dark p-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-semibold mb-3">
          Welcome to GNW visit tracking app
        </h1>
        <p className="text-md text-gray-400">Access all your visits and more</p>
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>

        {/* Render the error message */}
        {error && (
          <div className="mx-6 p-3 bg-red-900/50 text-red-100 border border-red-800 rounded-md">
            {error}
          </div>
        )}

        <form action={handle}>
          <CardContent className="grid gap-4 pt-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                name="email"
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input name="password" id="password" type="password" required />
            </div>
            <div className="pt-6" />
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
