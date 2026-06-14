const admin = require("firebase-admin");
const {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated
} = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const nodemailer = require("nodemailer");

admin.initializeApp();

const gmailUser = defineSecret("GMAIL_USER");
const gmailPassword = defineSecret("GMAIL_PASSWORD");
const emailTo = defineSecret("EMAIL_TO");

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatValue(value) {
  if (value && typeof value.toDate === "function") return value.toDate().toISOString();
  return value;
}

function formatRows(rows) {
  return `
    <table>
      ${rows.map(([label, value]) => `
        <tr>
          <th align="left">${escapeHtml(label)}</th>
          <td>${escapeHtml(formatValue(value))}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

function rsvpRows(rsvp) {
  return [
    ["Slot", rsvp.slotId],
    ["Name", rsvp.name],
    ["Guest of", rsvp.guestOf],
    ["Phone number", rsvp.contact],
    ["Status", rsvp.status],
    ["Created", rsvp.createdAt]
  ];
}

function formatCreatedEmail(rsvp) {
  return `
    <p>New My Way RSVP received.</p>
    ${formatRows(rsvpRows(rsvp))}
  `;
}

function changedRows(before, after) {
  return [
    ["Name", [before.name, after.name]],
    ["Guest of", [before.guestOf, after.guestOf]]
  ]
    .filter(([, values]) => values[0] !== values[1])
    .map(([label, values]) => [label, `${formatValue(values[0]) || ""} -> ${formatValue(values[1]) || ""}`]);
}

function formatUpdatedEmail(before, after) {
  const changes = changedRows(before, after);
  return `
    <p>My Way RSVP updated.</p>
    ${changes.length ? formatRows(changes) : "<p>No public RSVP fields changed.</p>"}
    <h3>Current RSVP</h3>
    ${formatRows(rsvpRows(after))}
  `;
}

function formatDeletedEmail(rsvp) {
  return `
    <p>My Way RSVP removed.</p>
    ${formatRows(rsvpRows(rsvp))}
  `;
}

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser.value(),
      pass: gmailPassword.value()
    }
  });
}

async function sendOwnerEmail(subject, html) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: gmailUser.value(),
    to: emailTo.value(),
    subject,
    html
  });
}

function publicRsvpFieldsChanged(before, after) {
  return ["name", "guestOf"].some((key) => before?.[key] !== after?.[key]);
}

function guestName(rsvp) {
  return rsvp.name || "Guest";
}

const timeZoneId = "America/Chicago";
const slotTimes = {
  morning: {
    start: "09:00",
    end: "16:00",
    endOffsetDays: 0,
    label: "Morning",
    description: "Signed up for the morning boat slot."
  },
  evening: {
    start: "17:00",
    end: "23:00",
    endOffsetDays: 0,
    label: "Evening",
    description: "Signed up for the evening boat slot."
  }
};

function parseSlotId(slotId) {
  const match = String(slotId || "").match(/^(\d{4}-\d{2}-\d{2})_(morning|evening)$/);
  if (!match) return null;
  return { date: match[1], slotId: match[2] };
}

function addDaysKey(dateKey, count) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + count));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
}

function icsDateTime(dateKey, time) {
  return `${dateKey.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

function foldIcsLine(line) {
  if (line.length <= 75) return line;
  const parts = [];
  let remaining = line;
  while (remaining.length > 75) {
    parts.push(remaining.slice(0, 75));
    remaining = ` ${remaining.slice(75)}`;
  }
  parts.push(remaining);
  return parts.join("\r\n");
}

function escapeIcsText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatUtcStamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function vtimezoneLines() {
  return [
    "BEGIN:VTIMEZONE",
    `TZID:${timeZoneId}`,
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:-0600",
    "TZOFFSETTO:-0500",
    "TZNAME:CDT",
    "DTSTART:19700308T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:-0500",
    "TZOFFSETTO:-0600",
    "TZNAME:CST",
    "DTSTART:19701101T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
    "END:STANDARD",
    "END:VTIMEZONE"
  ];
}

function eventLines(rsvp, rsvpId, stamp) {
  const parsed = parseSlotId(rsvp.slotId);
  if (!parsed) return [];
  const slot = slotTimes[parsed.slotId];
  if (!slot) return [];
  const endDate = addDaysKey(parsed.date, slot.endOffsetDays);

  return [
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(rsvpId)}@my-way-boat`,
    `DTSTAMP:${stamp}`,
    `SUMMARY:${escapeIcsText(`My Way Boat - ${slot.label}`)}`,
    `DTSTART;TZID=${timeZoneId}:${icsDateTime(parsed.date, slot.start)}`,
    `DTEND;TZID=${timeZoneId}:${icsDateTime(endDate, slot.end)}`,
    `DESCRIPTION:${escapeIcsText(slot.description)}`,
    "END:VEVENT"
  ];
}

function buildRsvpCalendar(profile, rsvps) {
  const stamp = formatUtcStamp();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//My Way Boat//RSVP Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(`My Way Boat - ${profile.name || "RSVP"}`)}`,
    `X-WR-TIMEZONE:${timeZoneId}`,
    ...vtimezoneLines()
  ];

  for (const item of rsvps) {
    lines.push(...eventLines(item.data, item.id, stamp));
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

function isSeededCrewRsvpId(rsvpId) {
  return String(rsvpId || "").startsWith("crew_going_");
}

async function syncPrivateRsvpFromSummary(rsvpId, summary) {
  const privateRef = admin.firestore().collection("rsvps").doc(rsvpId);
  const privateSnapshot = await privateRef.get();
  if (!privateSnapshot.exists) return;

  await privateRef.set(
    {
      name: summary.name,
      guestOf: summary.guestOf,
      alertEmailError: admin.firestore.FieldValue.delete()
    },
    { merge: true }
  );
}

async function deletePrivateRsvp(rsvpId) {
  const privateRef = admin.firestore().collection("rsvps").doc(rsvpId);
  const privateSnapshot = await privateRef.get();
  if (privateSnapshot.exists) {
    await privateRef.delete();
  }
}

exports.rsvpCalendar = onRequest(async (request, response) => {
  if (request.method !== "GET") {
    response.status(405).send("Method not allowed.");
    return;
  }

  const profileId = String(request.query.profileId || "").trim();
  const token = String(request.query.token || "").trim();
  if (!profileId || !token) {
    response.status(400).send("Missing profileId or token.");
    return;
  }

  const db = admin.firestore();
  const profileSnapshot = await db.collection("rsvpProfiles").doc(profileId).get();
  if (!profileSnapshot.exists) {
    response.status(404).send("Calendar not found.");
    return;
  }

  const profile = profileSnapshot.data();
  if (!profile.calendarToken || profile.calendarToken !== token) {
    response.status(403).send("Calendar not available.");
    return;
  }

  const rsvpSnapshot = await db.collection("rsvps")
    .where("profileId", "==", profileId)
    .where("status", "==", "confirmed")
    .get();
  const rsvps = rsvpSnapshot.docs.map((doc) => ({
    id: doc.id,
    data: doc.data()
  }));

  response
    .status(200)
    .set("Content-Type", "text/calendar; charset=utf-8")
    .set("Cache-Control", "no-store")
    .send(buildRsvpCalendar(profile, rsvps));
});

exports.sendOwnerRsvpEmail = onDocumentCreated(
  {
    document: "rsvps/{rsvpId}",
    secrets: [gmailUser, gmailPassword, emailTo]
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    if (isSeededCrewRsvpId(event.params.rsvpId)) return;

    const rsvp = snapshot.data();
    try {
      await sendOwnerEmail(
        `New My Way RSVP: ${guestName(rsvp)} for ${rsvp.slotId || "slot"}`,
        formatCreatedEmail(rsvp)
      );

      await snapshot.ref.set(
        {
          alertEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
          alertEmailError: admin.firestore.FieldValue.delete()
        },
        { merge: true }
      );
    } catch (error) {
      await snapshot.ref.set(
        {
          alertEmailError: String(error && error.message ? error.message : error)
        },
        { merge: true }
      );
      throw error;
    }
  }
);

exports.sendOwnerRsvpEditEmail = onDocumentUpdated(
  {
    document: "rsvpSummaries/{rsvpId}",
    secrets: [gmailUser, gmailPassword, emailTo]
  },
  async (event) => {
    const beforeSnapshot = event.data?.before;
    const afterSnapshot = event.data?.after;
    if (!beforeSnapshot || !afterSnapshot) return;

    const before = beforeSnapshot.data();
    const after = afterSnapshot.data();
    if (!publicRsvpFieldsChanged(before, after)) return;
    if (isSeededCrewRsvpId(event.params.rsvpId)) {
      await syncPrivateRsvpFromSummary(event.params.rsvpId, after);
      return;
    }

    const privateRef = admin.firestore().collection("rsvps").doc(event.params.rsvpId);
    const privateSnapshot = await privateRef.get();
    const currentRsvp = privateSnapshot.exists ? privateSnapshot.data() : after;
    const updatedRsvp = {
      ...currentRsvp,
      name: after.name,
      guestOf: after.guestOf
    };

    await sendOwnerEmail(
      `Updated My Way RSVP: ${guestName(updatedRsvp)} for ${updatedRsvp.slotId || after.slotId || "slot"}`,
      formatUpdatedEmail({ ...currentRsvp, ...before }, updatedRsvp)
    );

    if (privateSnapshot.exists) {
      await privateRef.set(
        {
          name: after.name,
          guestOf: after.guestOf,
          alertEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
          alertEmailError: admin.firestore.FieldValue.delete()
        },
        { merge: true }
      );
    }
  }
);

exports.sendOwnerRsvpRemovalEmail = onDocumentDeleted(
  {
    document: "rsvpSummaries/{rsvpId}",
    secrets: [gmailUser, gmailPassword, emailTo]
  },
  async (event) => {
    const summarySnapshot = event.data;
    if (!summarySnapshot) return;

    const summary = summarySnapshot.data();
    if (isSeededCrewRsvpId(event.params.rsvpId)) {
      await deletePrivateRsvp(event.params.rsvpId);
      return;
    }

    const privateRef = admin.firestore().collection("rsvps").doc(event.params.rsvpId);
    const privateSnapshot = await privateRef.get();
    const rsvp = privateSnapshot.exists ? privateSnapshot.data() : summary;

    await sendOwnerEmail(
      `Removed My Way RSVP: ${guestName(rsvp)} for ${rsvp.slotId || summary.slotId || "slot"}`,
      formatDeletedEmail(rsvp)
    );

    if (privateSnapshot.exists) {
      await privateRef.delete();
    }
  }
);
