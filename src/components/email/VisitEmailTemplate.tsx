import * as React from "react";

interface VisitEmailProps {
  customerName: string;
  visitNote: string;
}

export function VisitEmailTemplate({
  customerName,
  visitNote,
}: VisitEmailProps) {
  const baseUrl = "https://trackmylawn.com";
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        fontSize: "14px",
        lineHeight: "1.6",
      }}
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
        <h2 style={{ marginTop: 0, marginBottom: "10px", fontSize: "16px" }}>
          Service Notes
        </h2>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontFamily: "inherit",
            margin: 0,
            color: "#555",
          }}
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
      <div
        style={{
          marginTop: "40px",
          borderTop: "1px solid #eaeaea",
          paddingTop: "20px",
        }}
      >
        <p style={{ margin: "0 0 5px 0" }}>Regards,</p>

        <div style={{ marginBottom: "5px" }}>
          <img
            src={`${baseUrl}/logo.png`}
            alt="Greenworks Logo"
            width="100"
            height="50"
            style={{ borderRadius: "8px", objectFit: "contain" }}
          />
        </div>

        {/* COMPANY NAME */}
        <p
          style={{
            margin: "0 0 5px 0",
            fontWeight: "bold",
            color: "#2e7d32",
            fontSize: "16px",
          }}
        >
          Greenworks Construction & Companies Inc
        </p>

        <p style={{ margin: "0 0 5px 0" }}>
          <a
            href="tel:+17055009000"
            style={{ textDecoration: "none", color: "#333" }}
          >
            +1 (705) 500-9000
          </a>
        </p>

        <p style={{ margin: "0 0 5px 0" }}>
          <a
            href="https://www.gnwlandscaping.ca"
            style={{ color: "#2563eb", textDecoration: "underline" }}
          >
            www.gnwlandscaping.ca
          </a>
        </p>

        <p style={{ margin: "0" }}>
          <a
            href="https://www.instagram.com/gnwlandscaping/"
            style={{ color: "#2563eb", textDecoration: "underline" }}
          >
            https://www.instagram.com/gnwlandscaping/
          </a>
        </p>
      </div>
    </div>
  );
}
