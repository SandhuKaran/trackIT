import * as React from "react";

interface VisitEmailProps {
  customerName: string;
}

// TODO : Still have to make the email format better
export function VisitEmailTemplate({ customerName }: VisitEmailProps) {
  return (
    <div>
      <h1>Hi, {customerName}!</h1>

      <p>We made a visit on your property.</p>

      <p>Thanks,</p>

      <p>Greenworks Landscaping Inc.</p>
    </div>
  );
}
