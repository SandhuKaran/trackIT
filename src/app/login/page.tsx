"use client";

import { useTransition } from "react";
import { signIn } from "next-auth/react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();

  async function handle(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    startTransition(async () => {
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/",
      });
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">
            Landscaping Portal Login
          </CardTitle>
        </CardHeader>

        <form action={handle}>
          <CardContent className="space-y-4">
            <Input name="email" type="email" placeholder="Email" required />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              required
            />
          </CardContent>

          <CardFooter>
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
