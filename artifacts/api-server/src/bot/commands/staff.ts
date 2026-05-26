import type { CommandContext } from "./index.js";
import { sendText, getAnySock } from "../connection.js";
import { getDb } from "../db/database.js";
import {
  getStaff, getStaffList, extractNumberFromJid, getMentionName,
  getUser, updateUser, addToInventory, addBan, removeBan, getBanList,
  updateGroup, getGroup, resetUserBalance, resetUserProfile,
} from "../db/queries.js";
import { getAllBotsStatus } from "../bot-manager.js";

function isModOrAbove(ctx: CommandContext): boolean {
  if (ctx.isOwner) return true;
  const staff = getStaff(ctx.sender);
  return !!staff && ["owner", "guardian", "mod"].includes(staff.role);
}

export async function handleStaff(ctx: CommandContext): Promise<void> {
  const { from, sender, args, command: cmd, sock } = ctx;

  // ── .bots — list connected bots (mods/guardians/owners only) ───────────────
  if (cmd === "bots") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods, guardians, and owner can use *.bots*.");
      return;
    }
    const bots = getAllBotsStatus();
    if (!bots || bots.length === 0) {
      await sendText(from, "🤖 No bots are configured.");
      return;
    }
    const lines = bots.map((b: any) => {
      const status = b.connected ? "🟢 Online" : "🔴 Offline";
      return `• *${b.name || b.id}* — ${status}`;
    });
    await sendText(from, `🤖 *Connected Bots*\n\n${lines.join("\n")}`);
    return;
  }

  // ── .modlist / .mods / .modslist / .cardmakers ─────────────────────────────
  if (cmd === "modlist" || cmd === "mods" || cmd === "modslist" || cmd === "cardmakers") {
    const staffList = getStaffList().filter((s: any) => s.role !== "owner");
    if (staffList.length === 0) {
      await sendText(from, "📋 No mods or guardians are registered.");
      return;
    }
    const grouped: Record<string, any[]> = { guardian: [], mod: [], recruit: [] };
    for (const s of staffList) {
      const key = s.role in grouped ? s.role : "mod";
      grouped[key].push(s);
    }
    const formatList = (role: string, emoji: string) => {
      if (!grouped[role] || grouped[role].length === 0) return "";
      return `\n${emoji} *${role.charAt(0).toUpperCase() + role.slice(1)}s*\n` +
        grouped[role].map((s: any) => `  • +${s.user_id} ${getMentionName(s.user_id) !== s.user_id ? `(${getMentionName(s.user_id)})` : ""}`).join("\n");
    };
    const body =
      formatList("guardian", "🛡️") +
      formatList("mod", "⚔️") +
      formatList("recruit", "🌱");
    await sendText(from, `📋 *Tenku Staff List*${body}`);
    return;
  }

  // ── .addmod / .addguardian ─────────────────────────────────────────────────
  if (cmd === "addmod" || cmd === "addguardian") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods, guardians, and owner can manage roles.");
      return;
    }
    const role = cmd === "addmod" ? "mod" : "guardian";
    const targetPhone = args[0]?.replace(/\D/g, "");
    if (!targetPhone) {
      await sendText(from, `❌ Usage: *.${cmd}* [phone_number]\nExample: .${cmd} 2348031234567`);
      return;
    }
    const db = getDb();
    const existing = db.prepare("SELECT * FROM staff WHERE user_id = ?").get(targetPhone) as any;
    if (existing && existing.role === role) {
      await sendText(from, `❌ +${targetPhone} is already a ${role}.`);
      return;
    }
    db.prepare("INSERT OR REPLACE INTO staff (user_id, role, added_by, added_at) VALUES (?, ?, ?, unixepoch())")
      .run(targetPhone, role, extractNumberFromJid(sender));
    await sendText(from, `✅ +${targetPhone} is now a *${role}*.`);
    return;
  }

  // ── .removeguardian / .removemod ──────────────────────────────────────────
  if (cmd === "removeguardian" || cmd === "removemod") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods, guardians, and owner can manage roles.");
      return;
    }
    const targetPhone = args[0]?.replace(/\D/g, "");
    if (!targetPhone) {
      await sendText(from, `❌ Usage: *.${cmd}* [phone_number]`);
      return;
    }
    const db = getDb();
    const existing = db.prepare("SELECT * FROM staff WHERE user_id = ?").get(targetPhone) as any;
    if (!existing) {
      await sendText(from, `❌ +${targetPhone} is not in the staff list.`);
      return;
    }
    if (existing.role === "owner") {
      await sendText(from, `❌ Cannot remove an owner from staff.`);
      return;
    }
    db.prepare("DELETE FROM staff WHERE user_id = ?").run(targetPhone);
    await sendText(from, `✅ +${targetPhone} has been removed from staff.`);
    return;
  }

  // ── .recruit ──────────────────────────────────────────────────────────────
  if (cmd === "recruit") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods, guardians, and owner can recruit.");
      return;
    }
    const targetPhone = args[0]?.replace(/\D/g, "");
    if (!targetPhone) {
      await sendText(from, "❌ Usage: *.recruit* [phone_number]");
      return;
    }
    const db = getDb();
    db.prepare("INSERT OR REPLACE INTO staff (user_id, role, added_by, added_at) VALUES (?, 'recruit', ?, unixepoch())")
      .run(targetPhone, extractNumberFromJid(sender));
    await sendText(from, `✅ +${targetPhone} has been recruited to Tenku staff.`);
    return;
  }

  // ── .addpremium ────────────────────────────────────────────────────────────
  if (cmd === "addpremium") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods, guardians, and owner can grant premium.");
      return;
    }
    const targetPhone = args[0]?.replace(/\D/g, "");
    const days = parseInt(args[1] || "30", 10);
    if (!targetPhone) {
      await sendText(from, "❌ Usage: *.addpremium* [phone_number] [days=30]");
      return;
    }
    const expiry = Math.floor(Date.now() / 1000) + days * 86400;
    updateUser(targetPhone, { premium: 1, premium_expiry: expiry });
    await sendText(from, `✅ +${targetPhone} now has *Premium* for ${days} day(s).\n🌟 Expires: ${new Date(expiry * 1000).toDateString()}`);
    return;
  }

  // ── .removepremium ─────────────────────────────────────────────────────────
  if (cmd === "removepremium") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods, guardians, and owner can remove premium.");
      return;
    }
    const targetPhone = args[0]?.replace(/\D/g, "");
    if (!targetPhone) {
      await sendText(from, "❌ Usage: *.removepremium* [phone_number]");
      return;
    }
    updateUser(targetPhone, { premium: 0, premium_expiry: 0 });
    await sendText(from, `✅ Premium removed from +${targetPhone}.`);
    return;
  }

  // ── .ban ──────────────────────────────────────────────────────────────────
  if (cmd === "ban") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods, guardians, and owner can ban users.");
      return;
    }
    const targetPhone = args[0]?.replace(/\D/g, "");
    const reason = args.slice(1).join(" ") || "Banned by staff";
    if (!targetPhone) {
      await sendText(from, "❌ Usage: *.ban* [phone_number] [reason]");
      return;
    }
    addBan("user", targetPhone, `+${targetPhone}`, reason, sender);
    await sendText(from, `🔨 +${targetPhone} has been *banned*.\n📋 Reason: ${reason}`);
    return;
  }

  // ── .unban ────────────────────────────────────────────────────────────────
  if (cmd === "unban") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods, guardians, and owner can unban users.");
      return;
    }
    const targetPhone = args[0]?.replace(/\D/g, "");
    if (!targetPhone) {
      await sendText(from, "❌ Usage: *.unban* [phone_number]");
      return;
    }
    removeBan("user", targetPhone);
    await sendText(from, `✅ +${targetPhone} has been *unbanned*.`);
    return;
  }

  // ── .banlist ──────────────────────────────────────────────────────────────
  if (cmd === "banlist") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods and above can view the ban list.");
      return;
    }
    const banned = getBanList().filter((b: any) => b.type === "user");
    if (!banned || banned.length === 0) {
      await sendText(from, "📋 No users are currently banned.");
      return;
    }
    const lines = banned.map((b: any) => `• +${b.target} — ${b.reason || "No reason"}`);
    await sendText(from, `🔨 *Banned Users* (${banned.length})\n\n${lines.join("\n")}`);
    return;
  }

  // ── .addrole ──────────────────────────────────────────────────────────────
  if (cmd === "addrole") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods, guardians, and owner can manage roles.");
      return;
    }
    const targetPhone = args[0]?.replace(/\D/g, "");
    const role = args[1]?.toLowerCase();
    if (!targetPhone || !role || !["mod", "guardian"].includes(role)) {
      await sendText(from, "❌ Usage: .addrole [phone_number] [mod|guardian]");
      return;
    }
    const db = getDb();
    db.prepare("INSERT OR REPLACE INTO staff (user_id, role, added_by, added_at) VALUES (?, ?, ?, unixepoch())")
      .run(targetPhone, role, extractNumberFromJid(sender));
    await sendText(from, `✅ +${targetPhone} is now a ${role}.`);
    return;
  }

  // ── .post ─────────────────────────────────────────────────────────────────
  if (cmd === "post") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods, guardians, and owner can post announcements.");
      return;
    }
    const message = args.join(" ");
    if (!message) {
      await sendText(from, "❌ Usage: *.post* [message]\nThis posts an announcement to the current group.");
      return;
    }
    const anySock = getAnySock();
    if (!anySock) {
      await sendText(from, "❌ Bot not available.");
      return;
    }
    await anySock.sendMessage(from, {
      text: `📢 *ANNOUNCEMENT*\n\n${message}`,
    });
    return;
  }

  // ── .join ─────────────────────────────────────────────────────────────────
  if (cmd === "join") {
    if (!ctx.isOwner) {
      await sendText(from, "❌ Only the owner can make the bot join groups.");
      return;
    }
    const inviteLink = args[0];
    if (!inviteLink) {
      await sendText(from, "❌ Usage: *.join* [invite_link]");
      return;
    }
    const code = inviteLink.replace("https://chat.whatsapp.com/", "").split("?")[0].trim();
    if (!code) {
      await sendText(from, "❌ Invalid invite link.");
      return;
    }
    try {
      await sock.groupAcceptInvite(code);
      await sendText(from, `✅ Bot has joined the group.`);
    } catch (err: any) {
      await sendText(from, `❌ Failed to join: ${err?.message || "Unknown error"}`);
    }
    return;
  }

  // ── .exit ─────────────────────────────────────────────────────────────────
  if (cmd === "exit") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods and above can make the bot leave.");
      return;
    }
    if (!from.endsWith("@g.us")) {
      await sendText(from, "❌ Must be used in a group.");
      return;
    }
    await sendText(from, "👋 Goodbye! The bot is leaving this group.");
    await sock.groupLeave(from).catch(() => {});
    return;
  }

  // ── .show ─────────────────────────────────────────────────────────────────
  if (cmd === "show") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods and above can use this command.");
      return;
    }
    const anySock = getAnySock();
    if (!anySock) {
      await sendText(from, "❌ Bot not connected.");
      return;
    }
    const user = anySock.user;
    const bots = getAllBotsStatus();
    const online = bots.filter((b: any) => b.connected).length;
    await sendText(from, `🤖 *Bot Info*\n\n📛 Name: ${user?.name || "Unknown"}\n📱 ID: ${user?.id || "Unknown"}\n🟢 Online Bots: ${online}/${bots.length}`);
    return;
  }

  // ── .dc / .ac / .rc ──────────────────────────────────────────────────────
  if (cmd === "dc" || cmd === "ac" || cmd === "rc") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods and above can change card settings.");
      return;
    }
    if (!from.endsWith("@g.us")) {
      await sendText(from, "❌ Must be used in a group.");
      return;
    }
    if (cmd === "dc") {
      updateGroup(from, { cards_enabled: "off", spawn_enabled: "off" });
      await sendText(from, "🃏 Card spawning *disabled* in this group.");
    } else if (cmd === "ac") {
      updateGroup(from, { cards_enabled: "on", spawn_enabled: "on" });
      await sendText(from, "🃏 Card spawning *enabled* in this group.");
    } else {
      updateGroup(from, { spawn_enabled: "off" });
      await sendText(from, "🃏 Auto card spawning *restricted* — manual spawning still works.");
    }
    return;
  }

  // ── .upload ────────────────────────────────────────────────────────────────
  if (cmd === "upload") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only staff can upload frames.");
      return;
    }
    const websiteUrl = process.env["WEBSITE_URL"] || "the Tenku website";
    await sendText(from, `🖼️ To upload frames, visit the Frames section on:\n${websiteUrl}\n\n_Use your staff account to access the upload feature._`);
    return;
  }

  // ── .rules ────────────────────────────────────────────────────────────────
  if (cmd === "rules") {
    if (!from.endsWith("@g.us")) {
      await sendText(from, "❌ Must be used in a group.");
      return;
    }
    const group = getGroup(from);
    const rules = group?.rules || null;
    if (!rules) {
      await sendText(from, "📋 No rules have been set for this group.\n\n_Use *.setrules* [rules text] to set them._");
      return;
    }
    await sendText(from, `📋 *Group Rules*\n\n${rules}`);
    return;
  }

  // ── .resetbal ─────────────────────────────────────────────────────────────
  if (cmd === "resetbal") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods and above can reset balances.");
      return;
    }
    const targetPhone = args[0]?.replace(/\D/g, "");
    if (!targetPhone) {
      await sendText(from, "❌ Usage: *.resetbal* [phone_number]");
      return;
    }
    resetUserBalance(targetPhone);
    await sendText(from, `✅ Balance reset for +${targetPhone}.`);
    return;
  }

  // ── .reset ────────────────────────────────────────────────────────────────
  if (cmd === "reset") {
    if (!ctx.isOwner) {
      await sendText(from, "❌ Only the owner can fully reset user profiles.");
      return;
    }
    const targetPhone = args[0]?.replace(/\D/g, "");
    if (!targetPhone) {
      await sendText(from, "❌ Usage: *.reset* [phone_number]");
      return;
    }
    resetUserProfile(targetPhone);
    await sendText(from, `✅ Profile fully reset for +${targetPhone}.`);
    return;
  }

  // ── .addinv ───────────────────────────────────────────────────────────────
  if (cmd === "addinv") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods and above can add inventory items.");
      return;
    }
    const targetPhone = args[0]?.replace(/\D/g, "");
    const item = args.slice(1).join(" ");
    if (!targetPhone || !item) {
      await sendText(from, "❌ Usage: *.addinv* [phone_number] [item name]");
      return;
    }
    addToInventory(targetPhone, item);
    await sendText(from, `✅ Added *${item}* to +${targetPhone}'s inventory.`);
    return;
  }

  // ── .setms ────────────────────────────────────────────────────────────────
  if (cmd === "setms") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods and above can set milestone messages.");
      return;
    }
    const msText = args.join(" ");
    if (!msText) {
      await sendText(from, "❌ Usage: *.setms* [message]\nMilestone message for the group.");
      return;
    }
    if (from.endsWith("@g.us")) {
      updateGroup(from, { milestone_msg: msText });
    } else {
      const db = getDb();
      db.prepare("INSERT OR REPLACE INTO bot_settings (key, value) VALUES ('global_milestone_msg', ?)").run(msText);
    }
    await sendText(from, `✅ Milestone message set:\n\n_${msText}_`);
    return;
  }

  // ── .delms ────────────────────────────────────────────────────────────────
  if (cmd === "delms") {
    if (!isModOrAbove(ctx)) {
      await sendText(from, "❌ Only mods and above can delete milestone messages.");
      return;
    }
    if (from.endsWith("@g.us")) {
      updateGroup(from, { milestone_msg: null });
    } else {
      const db = getDb();
      db.prepare("DELETE FROM bot_settings WHERE key = 'global_milestone_msg'").run();
    }
    await sendText(from, "✅ Milestone message deleted.");
    return;
  }

  // ── .website ──────────────────────────────────────────────────────────────
  if (cmd === "website") {
    const websiteUrl = process.env["WEBSITE_URL"] || "";
    if (!websiteUrl) {
      await sendText(from, "❌ Website URL not configured.");
      return;
    }
    await sendText(from, `🌐 *Tenku Website*\n\n${websiteUrl}`);
    return;
  }

  await sendText(from, `❌ Unknown staff command: *.${cmd}*\n\nAvailable: bots, modlist, addmod, addguardian, removeguardian, removemod, recruit, addpremium, removepremium, ban, unban, banlist, post, join, exit, show, dc, ac, rc, upload, rules, resetbal, reset, addinv, setms, delms, website`);
}
