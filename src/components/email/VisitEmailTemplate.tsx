import * as React from "react";

interface VisitEmailProps {
  customerName: string;
  visitNote: string;
}

// TODO : Still have to make the email format better
export function VisitEmailTemplate({
  customerName,
  visitNote,
}: VisitEmailProps) {
  return (
    <div
      style={{ fontFamily: "sans-serif", fontSize: "14px", lineHeight: "1.6" }}
    >
      <h1>Hi, {customerName}!</h1>

      <p>We made a visit on your property. Here are the details:</p>

      <div
        style={{
          padding: "12px",
          border: "1px solid #eaeaea",
          borderRadius: "5px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "10px" }}>Service Notes</h2>
        <pre
          style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}
        >
          {visitNote}
        </pre>
      </div>

      <p style={{ marginTop: "20px" }}>
        For more information, visit{" "}
        <a
          href="https://trackmylawn.com"
          style={{ color: "#2563eb", textDecoration: "underline" }}
        >
          trackmylawn.com
        </a>
      </p>
      <p>Thanks,</p>
      <p>Greenworks Landscaping Inc.</p>
    </div>
  );
}
