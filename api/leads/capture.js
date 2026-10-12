export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  const d = req.body || {};
  const ts = new Date().toISOString();
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";

  const lead = {
    name: d.name || "",
    email: d.email || "",
    phone: d.phone || "",
    vessel_type: d.vessel_type || "",
    product: d.product || "",
    kit: d.kit || "",
    issue: d.issue || "",
    details: d.details || "",
    location: d.location || "",
    source: d.source || "saltymarine-form",
    url: d.url || "",
    ts,
    ip,
  };

  const sgKey = process.env.SENDGRID_API_KEY;
  const notifyEmails = ["service@saltymarine.com", "jake@starboardyacht.com"];
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "hello@saltymarine.com";

  if (sgKey) {
    const body = [
      "New Salty Marine lead submitted:",
      "",
      "Name: " + lead.name,
      "Email: " + lead.email,
      "Phone: " + lead.phone || "—",
      "Vessel: " + lead.vessel_type || "—",
      "Product: " + lead.product || "—",
      "Kit: " + lead.kit || "—",
      "Issue: " + lead.issue || "—",
      "Details: " + lead.details || "—",
      "Location: " + lead.location || "—",
      "Source: " + lead.source,
      "URL: " + lead.url || "—",
      "IP: " + lead.ip,
      "Timestamp: " + lead.ts,
    ].join("\n");

    try {
      const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + sgKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: notifyEmails.map((e) => ({ email: e })) }],
          from: { email: fromEmail },
          subject: "New Salty Marine Lead — " + lead.name,
          content: [{ type: "text/plain", value: body }],
        }),
      });
      if (!resp.ok) {
        console.error("SendGrid error:", resp.status, await resp.text());
      }
    } catch (err) {
      console.error("Email notification failed (non-fatal):", err.message);
    }
  } else {
    console.log("Lead captured (no SENDGRID_API_KEY):", JSON.stringify(lead));
  }

  return res.status(200).json({
    status: "received",
    source: lead.source,
    ts,
  });
}
