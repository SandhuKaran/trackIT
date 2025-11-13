import type { Visit, Feedback } from "@prisma/client";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

// Define the shape of the visit data we expect from the 'visitsByDate' query
type VisitByDate = Visit & {
  feedback: Feedback | null;
  user: {
    name: string | null;
    email: string | null;
  };
};

interface EmployeeVisitCardProps {
  visit: VisitByDate;
}

/**
 * A read-only card for employees to view visit details,
 * including customer info and any feedback.
 */
export function EmployeeVisitCard({ visit }: EmployeeVisitCardProps) {
  return (
    <Card key={visit.id} className="shadow-xl">
      <CardHeader>
        <CardDescription className="flex justify-between">
          {/* Show the customer's name and the time of the visit */}
          <span className="font-medium text-white">{visit.user.name}</span>
          <span className="text-gray-400">
            {format(new Date(visit.date), "h:mm a")}
          </span>
        </CardDescription>
        {visit.signedBy && (
          <p className="text-xs text-gray-400 pt-1">
            Signed by: {visit.signedBy}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visit Note */}
        <p className="whitespace-pre-wrap">{visit.note}</p>

        {/* Visit Photo */}
        {visit.photoUrl && (
          <a
            href={visit.photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md overflow-hidden"
          >
            <img
              src={visit.photoUrl.replace("/upload/", "/upload/w_400,c_fill/")}
              alt="Visit photo"
              className="w-full h-auto object-cover"
            />
          </a>
        )}

        {/* Existing Feedback Display */}
        {visit.feedback && (
          <div className="pt-4 border-t border-gray-700 space-y-3">
            <p className="font-semibold text-white">Customer Feedback:</p>
            <p className="text-gray-300 italic">{visit.feedback.text}</p>

            {/* Feedback Photo */}
            {visit.feedback.photoUrl && (
              <a
                href={visit.feedback.photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md overflow-hidden"
              >
                <img
                  src={visit.feedback.photoUrl.replace(
                    "/upload/",
                    "/upload/w_400,c_fill/"
                  )}
                  alt="Feedback photo"
                  className="w-full h-auto object-cover"
                />
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
