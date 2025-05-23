import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

interface Props {
  params: { token: string };
}

export default async function Activate({ params }: Props) {
  const invitation = await prisma.invitation.findUnique({
    where: { token: params.token },
    include: { customer: true },
  });

  if (!invitation || invitation.expiresAt < new Date())
    return <p>Invalid or expired link.</p>;

  async function handle(formData: FormData) {
    "use server";
    const pwd = formData.get("password") as string;
    const hash = await bcrypt.hash(pwd, 10);

    // create the user row linked to customer
    await prisma.user.create({
      data: {
        email: invitation.customer.email,
        password: hash,
        customerId: invitation.customerId,
      },
    });

    // mark customer active and delete invitation
    await prisma.customer.update({
      where: { id: invitation.customerId },
      data: { status: "ACTIVE" },
    });
    await prisma.invitation.delete({ where: { id: invitation.id } });

    redirect("/login?activated=1");
  }

  return (
    <form action={handle} className="max-w-sm m-auto p-6 space-y-4">
      <h1 className="text-xl">Set your password</h1>
      <input
        type="password"
        name="password"
        required
        className="input w-full"
      />
      <button className="btn w-full">Activate account</button>
    </form>
  );
}
