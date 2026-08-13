const PDFDocument = require("pdfkit");
const { Writable } = require("stream");

// Sanitize text for PDF (Helvetica): remove control chars, replace em-dash so Edge/viewers open the file
function safeText(s) {
  if (s == null || s === undefined) return "-";
  const t = String(s)
    .replace(/\r\n/g, " ")
    .replace(/[\r\n\t]/g, " ")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\u2014/g, "-") // em dash -> hyphen
    .trim();
  return t || "-";
}

// Company details (can be overridden via env)
const COMPANY = {
  name: process.env.INVOICE_COMPANY_NAME || "Mov-Ment",
  address: process.env.INVOICE_COMPANY_ADDRESS || "Event Management Office",
  phone: process.env.INVOICE_COMPANY_PHONE || "",
  email: process.env.INVOICE_COMPANY_EMAIL || "contact@mov-ment.com",
  gstTaxId: process.env.INVOICE_GST_TAX_ID || "",
};
const BANK = {
  name: process.env.INVOICE_BANK_NAME || "",
  accountName: process.env.INVOICE_ACCOUNT_NAME || "",
  accountNumber: process.env.INVOICE_ACCOUNT_NUMBER || "",
  ifscSwift: process.env.INVOICE_IFSC_SWIFT || "",
};
const PAYMENT_DAYS = process.env.INVOICE_PAYMENT_DAYS || "7";

const SERVICE_ROWS = [
  { label: "Venue Arrangement", key: "venue" },
  { label: "Decoration", key: "decoration" },
  { label: "Catering", key: "catering" },
  { label: "Sound & Lighting", key: "sound_lighting" },
  { label: "Photography / Videography", key: "photography" },
  { label: "Event Management Fee", key: "event_management_fee" },
];

function line(doc, y, label, value) {
  doc.fontSize(9).fillColor("#333");
  doc.text(safeText(label), 50, y, { width: 180 });
  doc.text(safeText(value), 230, y, { width: 300, align: "left" });
}

function sectionTitle(doc, title, y) {
  doc.fontSize(11).fillColor("#000").font("Helvetica-Bold").text(safeText(title), 50, y);
  return y + 18;
}

/**
 * Generate invoice PDF and return as Buffer (so we can send a complete, valid PDF).
 * @param {Object} event - Populated event (bookedBy, assignedManager, location, additionalServices, etc.)
 * @param {string} invoiceNumber - e.g. INV-{eventId slice}
 * @returns {Promise<Buffer>}
 */
function generateInvoicePdf(event, invoiceNumber) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];
    const collector = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
        callback();
      },
    });
    collector.on("finish", () => resolve(Buffer.concat(chunks)));
    collector.on("error", reject);
    doc.on("error", reject);
    doc.pipe(collector);

    try {
  if (!event || typeof event !== "object") return reject(new Error("Invalid event"));

  const bookedBy = event.bookedBy && typeof event.bookedBy === "object" ? event.bookedBy : {};
  const name = safeText(bookedBy.name);
  const email = safeText(bookedBy.email);
  const phone = safeText(bookedBy.phone);
  const loc = event.location && typeof event.location === "object" ? event.location : null;
  const clientAddress = loc
    ? [loc.addressLine, loc.city, loc.pincode].filter(Boolean).join(", ")
    : "";
  const clientAddressSafe = safeText(clientAddress);

  const invoiceDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const dueDate = new Date(Date.now() + parseInt(PAYMENT_DAYS, 10) * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const eventDate = event.scheduledAt
    ? new Date(event.scheduledAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "";
  const eventLocation = event.venue
    ? event.venue + (loc && loc.city ? ", " + loc.city : "")
    : loc
      ? [loc.addressLine, loc.city].filter(Boolean).join(", ")
      : "";
  const eventLocationSafe = safeText(eventLocation);
  const eventTitleSafe = safeText(event.title);

  let y = 50;

  // --- Company ---
  doc.fontSize(14).fillColor("#000").font("Helvetica-Bold").text("Event Management Invoice", 50, y);
  y += 28;
  doc.fontSize(10).font("Helvetica-Bold").text(safeText(COMPANY.name), 50, y);
  y += 14;
  doc.font("Helvetica").fontSize(9).fillColor("#333");
  doc.text("Address: " + safeText(COMPANY.address), 50, y);
  y += 12;
  if (COMPANY.phone) {
    doc.text("Phone: " + safeText(COMPANY.phone), 50, y);
    y += 12;
  }
  doc.text("Email: " + safeText(COMPANY.email), 50, y);
  y += 12;
  if (COMPANY.gstTaxId) {
    doc.text("GST / Tax ID: " + safeText(COMPANY.gstTaxId), 50, y);
    y += 12;
  }
  y += 8;

  // --- Invoice meta ---
  y = sectionTitle(doc, "Invoice Number: " + safeText(invoiceNumber), y);
  line(doc, y, "Invoice Date:", invoiceDate);
  y += 12;
  line(doc, y, "Due Date:", dueDate);
  y += 20;

  // --- Bill To ---
  y = sectionTitle(doc, "Bill To (Client Details)", y);
  line(doc, y, "Client Name:", name);
  y += 12;
  line(doc, y, "Company / Organization (if any):", safeText(bookedBy && bookedBy.company));
  y += 12;
  line(doc, y, "Address:", clientAddressSafe);
  y += 12;
  line(doc, y, "Phone:", phone);
  y += 12;
  line(doc, y, "Email:", email);
  y += 20;

  // --- Event Details ---
  y = sectionTitle(doc, "Event Details", y);
  line(doc, y, "Event Name:", eventTitleSafe);
  y += 12;
  line(doc, y, "Event Date:", eventDate);
  y += 12;
  line(doc, y, "Event Location:", eventLocationSafe);
  y += 22;

  // --- Services table ---
  doc.font("Helvetica-Bold").fontSize(10).text("Services & Charges", 50, y);
  y += 16;
  const col1 = 50;
  const col2 = 220;
  const col3 = 320;
  const col4 = 380;
  const col5 = 450;
  doc.font("Helvetica").fontSize(8).fillColor("#444");
  doc.text("No.", col1, y);
  doc.text("Description of Service", col2, y);
  doc.text("Qty", col3, y);
  doc.text("Rate", col4, y);
  doc.text("Amount", col5, y);
  y += 14;
  doc.moveTo(50, y).lineTo(520, y).stroke();
  y += 10;

  const services = Array.isArray(event.additionalServices) ? event.additionalServices : [];
  const serviceLabels = services.map((s) => (typeof s === "string" ? s : (s && s.service) || "Service")).filter(Boolean);
  const standardLabels = SERVICE_ROWS.map((r) => r.label);
  const customLabels = serviceLabels.filter(
    (l) => !standardLabels.some((r) => r.toLowerCase().includes((l || "").toLowerCase()))
  );
  const rows = standardLabels.length ? standardLabels : ["Event package"];
  if (customLabels.length) rows.push(...customLabels);

  rows.forEach((desc, i) => {
    doc.fontSize(9).fillColor("#333");
    doc.text(String(i + 1), col1, y);
    doc.text(safeText(desc), col2, y, { width: 95 });
    doc.text("1", col3, y);
    doc.text("As per quote", col4, y);
    doc.text("-", col5, y);
    y += 14;
  });

  y += 6;
  doc.moveTo(col2, y).lineTo(520, y).stroke();
  y += 10;
  doc.text("Subtotal", col2, y);
  doc.text("-", col5, y);
  y += 12;
  doc.text("Tax (if applicable)", col2, y);
  doc.text("-", col5, y);
  y += 12;
  doc.font("Helvetica-Bold").text("Total Amount", col2, y);
  doc.text("-", col5, y);
  doc.font("Helvetica");
  y += 24;

  // --- Payment Details ---
  y = sectionTitle(doc, "Payment Details", y);
  line(doc, y, "Bank Name:", BANK.name);
  y += 12;
  line(doc, y, "Account Name:", BANK.accountName);
  y += 12;
  line(doc, y, "Account Number:", BANK.accountNumber);
  y += 12;
  line(doc, y, "IFSC / SWIFT:", BANK.ifscSwift);
  y += 12;
  doc.text("Payment Method: (Bank Transfer / Cash / Online)", 50, y);
  y += 22;

  // --- Notes / Terms ---
  y = sectionTitle(doc, "Notes / Terms", y);
  doc.font("Helvetica").fontSize(9).fillColor("#333");
  doc.text("Payment due within " + safeText(PAYMENT_DAYS) + " days.", 50, y);
  y += 14;
  doc.text("Advance received (if any): ______", 50, y);
  y += 12;
  doc.text("Balance payable: ______", 50, y);
  y += 28;
  doc.fontSize(9).text("Authorized Signature:", 50, y);
  y += 12;
  doc.text("(Name & Signature)", 50, y);
  y += 10;
  doc.text("Event Manager / Company Seal", 50, y);

  doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInvoicePdf };
