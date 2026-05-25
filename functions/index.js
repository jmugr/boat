const admin = require("firebase-admin");
const {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated
} = require("firebase-functions/v2/firestore");
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
