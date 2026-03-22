const WEBHOOK_URL_Notify_Admin = process.env.DISCORD_WEBHOOK_URL!;
const WEBHOOK_URL_Notify_members = process.env.DISCORD_WEBHOOK_URL_members!;

async function sendWebhook(payload: object) {
  if (!WEBHOOK_URL_Notify_Admin) {
    console.warn("DISCORD_WEBHOOK_URL not set — skipping notification");
    return;
  }
  const res = await fetch(WEBHOOK_URL_Notify_Admin, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error("Discord webhook failed:", await res.text());
  }
}
async function sendWebhookCongratulation(payload: object) {
  if (!WEBHOOK_URL_Notify_members) {
    console.warn("DISCORD_WEBHOOK_URL not set — skipping notification");
    return;
  }
  const res = await fetch(WEBHOOK_URL_Notify_members, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error("Discord webhook failed:", await res.text());
  }
}
// ─── New badge request → notify admins channel ────────────────────────────────
export async function notifyNewRequest(opts: {
  memberName: string;
  memberEmail: string;
  badgeName: string;
  badgeIcon: string;
  badgeColor: string;
  note: string;
  requestId: string;
}) {
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  await sendWebhook({
    content:"@everyone",
    embeds: [
      {
        title: `${opts.badgeIcon} New Badge Request`,
        color: parseInt(opts.badgeColor.replace("#", ""), 16),
        fields: [
          { name: "👤 Member", value: `${opts.memberName} (${opts.memberEmail})`, inline: true },
          { name: "🏅 Badge", value: opts.badgeName, inline: true },
          { name: "📝 Proof / Note", value: opts.note },
        ],
        footer: { text: "Linux Badger • Badge System" },
        timestamp: new Date().toISOString(),
        url: `${appUrl}/admin/requests`,
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: "Review Request",
            url: `${appUrl}/admin/requests`,
          },
        ],
      },
    ],
  });
}

// ─── Request approved → notify admins channel ─────────────────────────────────
export async function notifyRequestApproved(opts: {
  memberName: string;
  badgeName: string;
  badgeIcon: string;
  badgeColor: string;
  badgePoints: number;
  reviewNote?: string;
}) {
  await sendWebhook({
    content: "@everyone",
    embeds: [
      {
        title: `✅ Badge Approved`,
        description: `**${opts.memberName}** has been awarded **${opts.badgeIcon} ${opts.badgeName}**`,
        color: parseInt(opts.badgeColor.replace("#", ""), 16),
        fields: [
          { name: "Points Awarded", value: `+${opts.badgePoints} pts`, inline: true },
          ...(opts.reviewNote ? [{ name: "Admin Note", value: opts.reviewNote }] : []),
        ],
        footer: { text: "Linux Badger • Badge System" },
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

// ─── Request rejected → notify admins channel ─────────────────────────────────
export async function notifyRequestRejected(opts: {
  memberName: string;
  badgeName: string;
  badgeIcon: string;
  reviewNote?: string;
}) {
  await sendWebhook({
    embeds: [
      {
        title: `❌ Badge Request Rejected`,
        description: `**${opts.memberName}**'s request for **${opts.badgeIcon} ${opts.badgeName}** was rejected`,
        color: 0xe05252,
        fields: [
          ...(opts.reviewNote ? [{ name: "Reason", value: opts.reviewNote }] : []),
        ],
        footer: { text: "Linux Badger • Badge System" },
        timestamp: new Date().toISOString(),
      },
    ],
  });
}


export async function notifyCongratulations(opts: {
  memberName: string;
  badgeName: string;
  badgeIcon: string;
  badgeColor: string;
  badgePoints: number;
}) {
  await sendWebhookCongratulation({
    content: `:tada:Congratulations ${opts.memberName} You've earned the **${opts.badgeName}** :trophy: +${opts.badgePoints} pts Keep up the good work!
 @Linux`,
    embeds: [
      {
        title: `✅ Badge Approved`,
        description: `**${opts.memberName}** has been awarded **${opts.badgeIcon} ${opts.badgeName}**`,
        color: parseInt(opts.badgeColor.replace("#", ""), 16),
        fields: [
          { name: "Points Awarded", value: `+${opts.badgePoints} pts`, inline: true },
        ],
        footer: { text: "Linux Badger • Badge System" },
        timestamp: new Date().toISOString(),
      },
    ],
  });
}