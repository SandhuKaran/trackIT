// page.tsx
import { smartRedirect } from "@/lib/redirectAfterLogin";

export default async function Home() {
  await smartRedirect();
  return null;
}
