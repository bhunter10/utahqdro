#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { loadEnvConfig } = require("@next/env");

const defaultInput = path.join(process.cwd(), "private-imports", "qdro-request-2026-10-08.csv");
const args = new Set(process.argv.slice(2));
const write = args.has("--write");
const replaceExisting = args.has("--replace-existing");
const inputArg = process.argv.find((arg) => arg.startsWith("--input="));
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const inputPath = inputArg ? path.resolve(inputArg.slice("--input=".length)) : defaultInput;
const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : 0;

loadEnvConfig(process.cwd());

function parseCsv(input) {
  const rows = [];
  let row = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === "\"") {
      if (quoted && input[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[i + 1] === "\n") i += 1;
      row.push(current);
      current = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
    } else {
      current += char;
    }
  }

  row.push(current);
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

function normalizeHeader(value) {
  return value.replace(/^\uFEFF/, "").trim();
}

function makeReader(headers, row) {
  const indexByHeader = new Map();
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    if (!indexByHeader.has(normalized)) indexByHeader.set(normalized, []);
    indexByHeader.get(normalized).push(index);
  });

  function byHeader(header, occurrence = 0) {
    const indexes = indexByHeader.get(header) || [];
    const index = indexes[occurrence];
    return clean(index === undefined ? "" : row[index]);
  }

  function first(headersToTry) {
    for (const header of headersToTry) {
      const value = byHeader(header);
      if (value) return value;
    }
    return "";
  }

  return { byHeader, first };
}

function clean(value) {
  return String(value || "").replace(/\u00a0/g, " ").trim();
}

function joinName(parts) {
  return parts.map(clean).filter(Boolean).join(" ").replace(/\s+/g, " ");
}

function joinAddress(reader, prefix) {
  const parts = [
    reader.byHeader(`${prefix} (Street Address)`),
    reader.byHeader(`${prefix} (Address Line 2)`),
    [reader.byHeader(`${prefix} (City)`), reader.byHeader(`${prefix} (State)`), reader.byHeader(`${prefix} (State / Province)`)]
      .filter(Boolean)
      .join(", "),
    reader.byHeader(`${prefix} (ZIP / Postal Code)`)
  ].filter(Boolean);
  return parts.join("\n");
}

function normalizeDate(value) {
  const raw = clean(value);
  if (!raw) return "";
  const datePart = raw.split(/\s+/)[0];
  const slashMatch = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}-${normalizeYear(year)}`;
  }
  const dashMatch = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (dashMatch) {
    const [, year, month, day] = dashMatch;
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}-${year}`;
  }
  return raw;
}

function normalizeYear(value) {
  if (value.length === 4) return value;
  const number = Number(value);
  return String(number >= 70 ? 1900 + number : 2000 + number);
}

function normalizeIsoDate(value) {
  const raw = clean(value);
  if (!raw) return new Date().toISOString();
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function normalizePaymentState(value) {
  const normalized = clean(value).toLowerCase();
  if (normalized.includes("paid") || normalized.includes("complete") || normalized.includes("approved")) return "paid";
  if (normalized.includes("pending") || normalized.includes("processing")) return "pending";
  return "unpaid";
}

function normalizeRequestStatus(reader) {
  return reader.byHeader("Status") || "Pending";
}

function normalizeDivisionType(value) {
  const normalized = clean(value).toLowerCase();
  if (normalized.includes("fixed")) return "Fixed amount";
  if (normalized.includes("percent")) return "Percentage";
  return normalized ? value : "I don't know";
}

function normalizeAccountType(value, tspValue) {
  const raw = clean(value);
  const lower = raw.toLowerCase();
  if (lower.includes("401")) return "401k plan";
  if (lower.includes("403")) return "403b plan";
  if (lower.includes("457")) return "457 plan";
  if (lower.includes("pension")) return "Pension";
  if (lower.includes("annuity")) return "Annuity";
  if (lower.includes("tsp") || tspValue) return "TSP";
  if (lower.includes("ira") && lower.includes("roth")) return "IRA Roth";
  if (lower.includes("ira")) return "IRA Traditional";
  return raw || "Other";
}

function normalizePlanFamily(reader) {
  const values = [
    reader.byHeader("Name of financial entity who holds the funds"),
    reader.byHeader("Financial Entity Name"),
    reader.byHeader("What is the formal name of the plan we are dividing?")
  ].join(" ").toLowerCase();

  const families = [
    "ADP",
    "Empower",
    "Fidelity",
    "Principal",
    "TSP",
    "URS",
    "DMBA",
    "Vanguard",
    "Charles Schwab",
    "John Hancock",
    "Transamerica",
    "IHC"
  ];

  return families.find((family) => values.includes(family.toLowerCase())) || reader.byHeader("Name of financial entity who holds the funds") || "Other";
}

function normalizeOwner(value) {
  const raw = clean(value);
  const lower = raw.toLowerCase();
  if (lower.includes("party 2") || lower.includes("second")) return "Party 2 (Second person named in your case)";
  if (lower.includes("party 1") || lower.includes("first")) return "Party 1 (First person named in your case)";
  return raw;
}

function normalizeAwardee(value) {
  return normalizeOwner(value);
}

function normalizeMarketAdjustment(value) {
  const normalized = clean(value).toLowerCase();
  if (normalized === "yes") return "The decree says interest, gains, and losses are included";
  if (normalized === "no") return "The decree says interest, gains, and losses are excluded";
  return clean(value);
}

function normalizeRequesterRole(value) {
  const normalized = clean(value).toLowerCase();
  if (normalized.includes("first")) return "I am the first name listed in the court case title";
  if (normalized.includes("second")) return "I am the second name listed in the court case title";
  if (normalized.includes("requesting")) return "I am requesting this for someone else";
  return clean(value);
}

function makeFiles(reader) {
  const sources = [
    ["decree", "Signed divorce decree", "Please upload your PDF copy of the decree/order"],
    ["statement", "Retirement account statement", "Please upload a recent statement of the account we are dividing"],
    ["other", "Appearance of Counsel Upload", "Appearance of Counsel Upload"],
    ["signed", "Certified QDRO", "Certified QDRO"],
    ["other", "Approval Letter or Proof of Division", "Approval Letter or Proof of Division"],
    ["signed", "Withdrawal of Counsel", "Withdrawal of Counsel"],
    ["generated", "PDF: Appearance of Counsel", "PDF: Appearance of Counsel"],
    ["generated", "PDF: URS", "PDF: URS"],
    ["generated", "PDF: URS Addendum", "PDF: URS Addendum"],
    ["generated", "PDF: Withdrawal of Counsel", "PDF: Withdrawal of Counsel"],
    ["generated", "PDF: Empower", "PDF: Empower"],
    ["generated", "PDF: URS Pension", "PDF: URS Pension"],
    ["generated", "PDF: DMBA - 401k", "PDF: DMBA - 401k"],
    ["generated", "PDF: DMBA - Pension", "PDF: DMBA - Pension"],
    ["generated", "PDF: Multi Template", "PDF: Multi Template"],
    ["generated", "PDF: Multi Template - ADP - 401k", "PDF: Multi Template - ADP - 401k"],
    ["generated", "PDF: T.RowPrice IHC - 401k", "PDF: T.RowPrice IHC - 401k"],
    ["generated", "PDF: Principal - 401k", "PDF: Principal - 401k"],
    ["generated", "PDF: IHC - 401k", "PDF: IHC - 401k"],
    ["generated", "PDF: IHC - Pension", "PDF: IHC - Pension"],
    ["generated", "PDF: TSP", "PDF: TSP"],
    ["generated", "PDF: TSP Addendum", "PDF: TSP Addendum"],
    ["generated", "PDF: Fidelity", "PDF: Fidelity"]
  ];

  return sources.flatMap(([kind, label, header], index) => {
    const raw = reader.byHeader(header);
    if (!raw) return [];
    return splitFileValues(raw).map((url, fileIndex) => ({
      id: `import-file-${index + 1}-${fileIndex + 1}`,
      label,
      kind,
      fileName: getFileName(url, label),
      status: "uploaded",
      url
    }));
  });
}

function splitFileValues(value) {
  return clean(value)
    .split(/\s*[,|\n]\s*/)
    .map(clean)
    .filter(Boolean);
}

function getFileName(url, fallback) {
  try {
    const parsed = new URL(url);
    return decodeURIComponent(path.basename(parsed.pathname)) || `${fallback}.pdf`;
  } catch {
    return `${fallback}.pdf`;
  }
}

function buildFields(reader) {
  const divisionType = normalizeDivisionType(reader.byHeader("Is the division a fixed amount or percentage?"));
  const fixedAsOfDate = normalizeDate(reader.byHeader("As of date", 0));
  const percentAsOfDate = normalizeDate(reader.byHeader("As of date", 1));
  const party1Name = joinName([
    reader.byHeader("Party 1 name (First)"),
    reader.byHeader("Party 1 name (Middle)"),
    reader.byHeader("Party 1 name (Last)"),
    reader.byHeader("Party 1 name (Suffix)")
  ]);
  const party2Name = joinName([
    reader.byHeader("Party 2 name (First)"),
    reader.byHeader("Party 2 name (Middle)"),
    reader.byHeader("Party 2 name (Last)"),
    reader.byHeader("Party 2 name (Suffix)")
  ]);

  return {
    requester_role: normalizeRequesterRole(reader.byHeader("I am")) || "I am requesting this for someone else",
    requester_name: joinName([
      reader.byHeader("Party Requester Name (First)") || reader.byHeader("Your name (First)"),
      reader.byHeader("Party Requester Name (Middle)") || reader.byHeader("Your name (Middle)"),
      reader.byHeader("Party Requester Name (Last)") || reader.byHeader("Your name (Last)"),
      reader.byHeader("Party Requester Name (Suffix)") || reader.byHeader("Your name (Suffix)")
    ]),
    requester_phone: reader.byHeader("Party Requester Phone"),
    requester_email: reader.byHeader("Party Requester Email") || reader.byHeader("Your Email"),
    requester_affiliation: reader.byHeader("Which party are you affiliated with?"),
    case_number: reader.byHeader("What is your case number?"),
    court_location: reader.byHeader("Which court was your case assigned to?"),
    court_county: reader.byHeader("County"),
    district: reader.byHeader("District Number"),
    judge_name: reader.byHeader("Who was the judge that signed your decree?"),
    amended_text: reader.byHeader("Amended Text"),
    date_certified_sent_to_admin: normalizeDate(reader.byHeader("Date certified was sent to admin")),
    marriage_date: normalizeDate(reader.byHeader("Marriage date")),
    divorce_date: normalizeDate(reader.byHeader("Divorce date")),
    party1_name: party1Name,
    party1_email: reader.byHeader("Party 1 email"),
    party1_phone: reader.byHeader("Party 1 phone number"),
    party1_address_street: reader.byHeader("Party 1 current mailing address (Street Address)"),
    party1_address_line2: reader.byHeader("Party 1 current mailing address (Address Line 2)"),
    party1_address_city: reader.byHeader("Party 1 current mailing address (City)"),
    party1_address_state: reader.byHeader("Party 1 current mailing address (State)"),
    party1_address_zip: reader.byHeader("Party 1 current mailing address (ZIP / Postal Code)"),
    party1_full_address: joinAddress(reader, "Party 1 current mailing address"),
    party1_ssn: reader.byHeader("Party 1 SSN"),
    party1_dob: normalizeDate(reader.byHeader("Party 1 birth date")),
    party2_name: party2Name,
    party2_email: reader.byHeader("Party 2 email"),
    party2_phone: reader.byHeader("Party 2 phone number"),
    party2_address_street: reader.byHeader("Party 2 current mailing address (Street Address)"),
    party2_address_line2: reader.byHeader("Party 2 current mailing address (Address Line 2)"),
    party2_address_city: reader.byHeader("Party 2 current mailing address (City)"),
    party2_address_state: reader.byHeader("Party 2 current mailing address (State)"),
    party2_address_zip: reader.byHeader("Party 2 current mailing address (ZIP / Postal Code)"),
    party2_full_address: joinAddress(reader, "Party 2 current mailing address"),
    party2_ssn: reader.byHeader("Party 2 SSN"),
    party2_dob: normalizeDate(reader.byHeader("Party 2 birth date")),
    plan_family: normalizePlanFamily(reader),
    entity_name: reader.byHeader("Name of financial entity who holds the funds"),
    financial_entity_name: reader.byHeader("Financial Entity Name"),
    account_type: normalizeAccountType(reader.byHeader("What kind of account is this?"), reader.byHeader("What kind of TSP account is this?")),
    tsp_account_type: reader.byHeader("What kind of TSP account is this?"),
    has_employer: reader.byHeader("Is this account associated with an employer?"),
    employer_name: reader.byHeader("Employer name"),
    employer_phone: reader.byHeader("Employer Phone"),
    employer_address_street: reader.byHeader("Employer Address (Street Address)"),
    employer_address_line2: reader.byHeader("Employer Address (Address Line 2)"),
    employer_address_city: reader.byHeader("Employer Address (City)"),
    employer_address_state: reader.byHeader("Employer Address (State / Province)"),
    employer_address_zip: reader.byHeader("Employer Address (ZIP / Postal Code)"),
    employer_fax: reader.byHeader("Employer Fax"),
    employer_email: reader.byHeader("Employer Email"),
    account_owner: normalizeOwner(reader.byHeader("Which party is the current owner of the retirement account?")),
    formal_plan_name: reader.byHeader("What is the formal name of the plan we are dividing?"),
    plan_account_number: reader.byHeader("Contract number or account number associated with this plan, if one is on the statement?"),
    division_type: divisionType,
    fixed_award: reader.byHeader("What is the fixed amount?"),
    percent_award: reader.byHeader("What is the percentage amount?"),
    valuation_date: divisionType === "Fixed amount" ? fixedAsOfDate : percentAsOfDate,
    account_awardee: normalizeAwardee(reader.byHeader("Which party is being awarded some or all of this retirement account?")),
    market_adjustment: normalizeMarketAdjustment(reader.byHeader("Interest, Gains, and Losses")),
    client_signature: reader.byHeader("Please sign"),
    total: reader.byHeader("Total") || reader.byHeader("Payment Amount"),
    wordpress_status: reader.byHeader("Status")
  };
}

function getClientIdentity(fields, reader) {
  const requesterEmail = fields.requester_email;
  if (requesterEmail) {
    return {
      name: fields.requester_name || fields.party1_name || fields.party2_name || "Imported WordPress Request",
      email: requesterEmail
    };
  }

  if (fields.party1_email) return { name: fields.party1_name || "Imported WordPress Request", email: fields.party1_email };
  if (fields.party2_email) return { name: fields.party2_name || "Imported WordPress Request", email: fields.party2_email };
  return {
    name: fields.party1_name || fields.party2_name || "Imported WordPress Request",
    email: reader.byHeader("Username") || ""
  };
}

function buildNotes(reader) {
  const notes = reader.byHeader("Notes") || reader.byHeader("Entry Notes");
  if (!notes) return [];

  return [
    {
      id: `import-note-${Date.now()}`,
      author: "WordPress import",
      visibility: "internal",
      body: notes,
      createdAt: normalizeIsoDate(reader.byHeader("Entry Date"))
    }
  ];
}

function buildRequest(headers, row) {
  const reader = makeReader(headers, row);
  const entryId = reader.byHeader("Entry Id");
  const id = `QDRO-WP-${entryId || row.join("|").length}`;
  const fields = removeEmpty(buildFields(reader));
  const client = getClientIdentity(fields, reader);
  const paymentState = normalizePaymentState(reader.byHeader("Payment Status"));
  const status = normalizeRequestStatus(reader);
  const createdAt = normalizeIsoDate(reader.byHeader("Entry Date"));
  const updatedAt = normalizeIsoDate(reader.byHeader("Date Updated") || reader.byHeader("Entry Date"));

  return {
    id,
    ownerUid: `wordpress-import-${entryId || "unknown"}`,
    clientName: client.name,
    clientEmail: client.email,
    status,
    paymentState,
    signatureState: fields.client_signature ? "completed" : "not_started",
    templateFamily: fields.plan_family || "Other",
    fields,
    files: makeFiles(reader),
    notes: buildNotes(reader),
    createdAt,
    updatedAt
  };
}

function removeEmpty(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== "" && value !== undefined && value !== null));
}

function countBy(items, getter) {
  return items.reduce((counts, item) => {
    const key = getter(item) || "blank";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function summarizeMissing(requests) {
  const required = ["clientName", "clientEmail", "fields.case_number", "fields.party1_name", "fields.party2_name", "fields.formal_plan_name"];
  const missing = {};
  for (const request of requests) {
    for (const key of required) {
      const value = key.split(".").reduce((current, part) => (current ? current[part] : undefined), request);
      if (!value) missing[key] = (missing[key] || 0) + 1;
    }
  }
  return missing;
}

async function existingIds(db, ids) {
  const existing = new Set();
  for (let index = 0; index < ids.length; index += 30) {
    const batch = ids.slice(index, index + 30);
    await Promise.all(
      batch.map(async (id) => {
        const doc = await db.collection("requests").doc(id).get();
        if (doc.exists) existing.add(id);
      })
    );
  }
  return existing;
}

async function main() {
  const text = fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("CSV has no data rows.");

  const headers = rows[0].map(normalizeHeader);
  const sourceRows = limit > 0 ? rows.slice(1, 1 + limit) : rows.slice(1);
  const requests = sourceRows.map((row) => buildRequest(headers, row));
  const duplicateIds = requests
    .map((request) => request.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);

  console.log(`mode=${write ? "write" : "dry-run"}`);
  console.log(`replaceExisting=${replaceExisting ? "yes" : "no"}`);
  console.log(`input=${inputPath}`);
  console.log(`limit=${limit > 0 ? limit : "none"}`);
  console.log(`rows=${requests.length}`);
  console.log(`uniqueIds=${new Set(requests.map((request) => request.id)).size}`);
  console.log(`duplicateIds=${new Set(duplicateIds).size}`);
  console.log(`statusCounts=${JSON.stringify(countBy(requests, (request) => request.status))}`);
  console.log(`paymentCounts=${JSON.stringify(countBy(requests, (request) => request.paymentState))}`);
  console.log(`templateFamilyCounts=${JSON.stringify(countBy(requests, (request) => request.templateFamily))}`);
  console.log(`missingRequiredCounts=${JSON.stringify(summarizeMissing(requests))}`);
  console.log(`totalAttachedFileRefs=${requests.reduce((sum, request) => sum + request.files.length, 0)}`);

  if (!write) {
    console.log("No database writes performed. Re-run with --write to import.");
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin env vars are missing.");
  }

  if (!getApps().length) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }

  const db = getFirestore();
  const existing = await existingIds(db, requests.map((request) => request.id));
  if (existing.size && !replaceExisting) {
    throw new Error(`${existing.size} request ids already exist. Import aborted without overwriting.`);
  }

  for (let index = 0; index < requests.length; index += 400) {
    const batch = db.batch();
    for (const request of requests.slice(index, index + 400)) {
      batch.set(db.collection("requests").doc(request.id), request, { merge: false });
    }
    await batch.commit();
    console.log(`committed=${Math.min(index + 400, requests.length)}/${requests.length}`);
  }

  console.log(`imported=${requests.length}`);
  console.log(`projectId=${projectId}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
