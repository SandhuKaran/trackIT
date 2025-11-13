import type { Request } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RequestCardProps {
  request: Pick<
    Request,
    "id" | "title" | "description" | "photoUrl" | "createdAt"
  >;
}

export function RequestCard({ request }: RequestCardProps) {
  return (
    <Card key={request.id} className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">{request.title}</CardTitle>
        <CardDescription>
          Requested on:{" "}
          {new Intl.DateTimeFormat("en-CA", {
            dateStyle: "medium",
          }).format(new Date(request.createdAt))}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap">{request.description}</p>
        {request.photoUrl && (
          <a
            href={request.photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md overflow-hidden"
          >
            <img
              src={request.photoUrl.replace(
                "/upload/",
                "/upload/w_400,c_fill/"
              )}
              alt="Request photo"
              className="w-full h-auto object-cover"
            />
          </a>
        )}
      </CardContent>
    </Card>
  );
}
