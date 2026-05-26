import type { CommandContext } from "./index.js";
import { sendText } from "../connection.js";
import { getDb } from "../db/database.js";
import { getStaff, extractNumberFromJid, getMentionName } from "../db/queries.js";

export async function handleStaff(ctx: CommandContext): Promise<void> {
  const { from, sender, args, command: cmd } = ctx;

  if (cmd === "addrole") {
    if (!ctx.isOwner) {
      const staff = getStaff(ctx.sender);
      if (!staff || !["mod", "guardian", "owner"].includes(staff.role)) {
        await sendText(from, "❌ Only mods, guardians, and owner can manage roles.");
        return;
      }
    }

    const targetPhone = args[0]?.replace(/\D/g, "");
    const role = args[1]?.toLowerCase();

    if (!targetPhone || !role || !["mod", "guardian"].includes(role)) {
      await sendText(from, "❌ Usage: .addrole [phone_number] [mod|guardian]\nExample: .addrole 2348031234567 mod");
      return;
    }

    const db = getDb();
    const existing = db.prepare("SELECT * FROM staff WHERE user_id = ?").get(targetPhone) as any;

    if (existing && existing.role === role) {
      await sendText(from, `❌ User is already a ${role}.`);
      return;
    }

    db.prepare("INSERT OR REPLACE INTO staff (user_id, role, added_by, added_at) VALUES (?, ?, ?, unixepoch())").run(
      targetPhone,
      role,
      extractNumberFromJid(ctx.sender)
    );

    await sendText(from, `✅ +${targetPhone} is now a ${role}.`);
    return;
  }

  if (cmd === "website") {
    const websiteUrl = process.env["WEBSITE_URL"] || "";
    if (!websiteUrl) {
      await sendText(from, "❌ Website URL not configured.");
      return;
    }
    await sendText(from, `🌐 *Tenku Website*\n\n${websiteUrl}`);
    return;
  }

  await sendText(from, `📝 Staff command handler for *.${cmd}* needs implementation.`);
}
