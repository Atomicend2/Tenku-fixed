import type { CommandContext } from "./index.js";
import { sendText } from "../connection.js";
import {
  getUser, ensureUser, updateUser, getInventory, addToInventory, removeFromInventory,
  getShop, getShopItem, getRichList, ensureRpg, getUserRank, getUserGuild, isBanned, getStaff, isMod,
  getXpLeaderboard, isBot, getAllFrames, getFrameById, equipFrame, getMentionName, extractNumberFromJid,
} from "../db/queries.js";
import { getDb } from "../db/database.js";
import { formatNumber, timeAgo } from "../utils.js";
import sharp from "sharp";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

const DAILY_AMOUNT = 1000;
const DAILY_COOLDOWN = 86400;
const WORK_COOLDOWN = 3600;
const DIG_COOLDOWN = 120;
const FISH_COOLDOWN = 120;
const BEG_COOLDOWN = 300;
const STEAL_COOLDOWN = 6000;
const DIG_FISH_MIN_REWARD = 180;
const DIG_FISH_MAX_REWARD = 383;

const WORK_JOBS = [
  "You coded for 8 hours straight",
  "You delivered packages in the rain",
  "You served tables all night",
  "You fixed a mysterious server bug",
  "You designed a logo for a client",
  "You streamed for 4 hours",
  "You wrote an article",
  "You taught online classes",
];

const DIG_FINDS = [
  { item: "Ancient Coin" },
  { item: "Rusty Sword" },
  { item: "Buried Treasure" },
  { item: "Old Ring" },
  { item: "Gem Fragment" },
  { item: "Crystal Shard" },
  { item: "Golden Relic" },
];

const FISH_CATCHES = [
  { item: "Common Fish" },
  { item: "Rare Fish" },
  { item: "Legendary Fish" },
  { item: "Golden Koi" },
  { item: "Deep Sea Pearl" },
  { item: "Moonlit Tuna" },
  { item: "Treasure Clam" },
];

const BEG_RESPONSES = [
  "A kind stranger gave you some coins.",
  "Someone took pity on you.",
  "You found some loose change.",
  "A passerby dropped some coins.",
];

const execFileAsync = promisify(execFile);

async function runFfmpeg(args: string[]): Promise<void> {
  await execFileAsync("ffmpeg", ["-loglevel", "error", ...args], { maxBuffer: 10 * 1024 * 1024 });
}

const REGISTERED_ONLY_CMDS = new Set([
  "daily","work","dig","fish","beg","steal","donate",
  "richlist","richlistglobal","richlg","leaderboard","lb","stats",
  "buy","sell","use","withdraw","wid","wd","deposit","dep","roast",
  "shop",
]);

export async function handleEconomy(ctx: CommandContext): Promise<void> {
  const { from, sender, args, command: cmd } = ctx;

  const user = ensureUser(sender);
  const now = Math.floor(Date.now() / 1000);

  if (REGISTERED_ONLY_CMDS.has(cmd) && !user.registered) {
    await sendText(from, "❌ You need to complete registration first.\n\nType *.reg* to register via WhatsApp, or visit the website to register and verify with OTP.");
    return;
  }

  if (cmd === "balance" || cmd === "bal") {
    const displayName = user.name || extractNumberFromJid(sender);
    const wallet = user.balance || 0;
    const bank = user.bank || 0;
    const total = wallet + bank;
    // Calculate account capacity from bank note items
    const db = getDb();
    const inv = db.prepare("SELECT item FROM inventory WHERE user_id = ?").all(sender) as any[];
    let capBonus = 0;
    for (const row of inv) {
      if (row.item?.includes("10K Bank Note")) capBonus += 50000;
      if (row.item?.includes("50K Bank Note")) capBonus += 250000;
      if (row.item?.includes("100K Bank Note")) capBonus += 750000;
    }
    const accountCapacity = 50_000 + capBonus;
    const pct = Math.min(100, Math.floor((total / accountCapacity) * 100));
    const filled = Math.round((pct / 100) * 10);
    const bar = "█".repeat(filled) + "░".repeat(10 - filled);
    await sendText(
      from,
      `💰 𝗔𝗖𝗖𝗢𝗨𝗡𝗧 𝗕𝗔𝗟𝗔𝗡𝗖𝗘\n\n` +
      `𝗡𝗮𝗺𝗲: ${displayName}\n` +
      `𝗪𝗮𝗹𝗹𝗲𝘁: $${formatNumber(wallet)}\n` +
      `𝗕𝗮𝗻𝗸:   $${formatNumber(bank)}\n` +
      `𝗧𝗼𝘁𝗮𝗹:  $${formatNumber(total)}\n` +
      `𝗖𝗮𝗽𝗮𝗰𝗶𝘁𝘆: $${formatNumber(accountCapacity)}\n\n` +
      `│ ${bar} ${pct}%`
    );
    return;
  }

  if (cmd === "gems") {
    await sendText(from, `💎 You have *${user.gems || 0}* gems.`);
    return;
  }

  if (cmd === "premiumbal" || cmd === "pbal") {
    await sendText(from, `⭐ Premium Balance: *${formatNumber(user.premium_balance || 0)} pts*`);
    return;
  }

  if (cmd === "premium" || cmd === "prem") {
    if (user.premium) {
      const exp = user.premium_expiry;
      const left = exp - now;
      if (left > 0) {
        await sendText(from, `⭐ You have *Premium* status!\nExpires in: ${formatDuration(left)}`);
      } else {
        updateUser(sender, { premium: 0 });
        await sendText(from, "❌ Your premium has expired.");
      }
    } else {
      await sendText(from, "❌ You don't have premium. Get it from an owner/admin.");
    }
    return;
  }

  if (cmd === "membership" || cmd === "memb") {
    const lvl = user.level || 1;
    const xp = user.xp || 0;
    const xpNeeded = lvl * 100;
    await sendText(
      from,
      `👤 *Membership — @${getMentionName(sender)}*\n\n` +
      `🎖️ Level: ${lvl}\n` +
      `✨ XP: ${xp} / ${xpNeeded}\n` +
      `⭐ Premium: ${user.premium ? "Yes" : "No"}\n` +
      `📅 Joined: ${timeAgo(user.created_at || now)}`,
      [sender]
    );
    return;
  }

  if (cmd === "daily") {
    const last = user.last_daily || 0;
    const diff = now - last;
    if (diff < DAILY_COOLDOWN) {
      const remaining = DAILY_COOLDOWN - diff;
      await sendText(from, `⏳ Daily cooldown: ${formatDuration(remaining)} left.`);
      return;
    }
    const amount = DAILY_AMOUNT + (user.premium ? 500 : 0);
    updateUser(sender, { balance: (user.balance || 0) + amount, last_daily: now });
    await sendText(from, `🎁 Daily reward: *$${formatNumber(amount)}*!\nNew balance: $${formatNumber((user.balance || 0) + amount)}`);
    return;
  }

  if (cmd === "withdraw" || cmd === "wid" || cmd === "wd") {
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0) {
      await sendText(from, "❌ Enter a valid amount. Usage: .withdraw [amount]");
      return;
    }
    if (amount > (user.bank || 0)) {
      await sendText(from, `❌ Not enough in bank. Bank: $${formatNumber(user.bank || 0)}`);
      return;
    }
    updateUser(sender, { bank: (user.bank || 0) - amount, balance: (user.balance || 0) + amount });
    await sendText(from, `✅ Withdrew $${formatNumber(amount)} from bank.\nWallet: $${formatNumber((user.balance || 0) + amount)}`);
    return;
  }

  if (cmd === "deposit" || cmd === "dep") {
    const wallet = user.balance || 0;
    const parsed = parseInt(args[0]);
    const amount = (isNaN(parsed) || !args[0]) ? wallet : parsed;
    if (amount <= 0) {
      await sendText(from, "❌ Your wallet is empty.");
      return;
    }
    if (amount > wallet) {
      await sendText(from, `❌ Not enough in wallet. Wallet: $${formatNumber(wallet)}`);
      return;
    }
    updateUser(sender, { balance: wallet - amount, bank: (user.bank || 0) + amount });
    await sendText(from, `✅ Deposited $${formatNumber(amount)} to bank.\nBank: $${formatNumber((user.bank || 0) + amount)}`);
    return;
  }

  if (cmd === "donate") {
    const info = ctx.msg.message?.extendedTextMessage?.contextInfo;
    const mentioned = info?.mentionedJid?.[0] || info?.participant;
    const amount = parseInt(args[args.length - 1]);
    if (!mentioned || isNaN(amount) || amount <= 0) {
      await sendText(from, "❌ Usage: .donate @user [amount] or reply with .donate [amount]");
      return;
    }
    if (isBot(mentioned)) {
      await sendText(from, "❌ Bots are not part of the economy system.");
      return;
    }
    if (amount > (user.balance || 0)) {
      await sendText(from, "❌ Not enough in wallet.");
      return;
    }
    const target = ensureUser(mentioned);
    updateUser(sender, { balance: (user.balance || 0) - amount });
    updateUser(mentioned, { balance: (target.balance || 0) + amount });
    await sendText(from, `💸 @${getMentionName(sender)} donated $${formatNumber(amount)} to @${getMentionName(mentioned)}!`, [sender, mentioned]);
    return;
  }

  if (cmd === "cds") {
    const rpg = ensureRpg(sender);
    const allCooldowns: Array<{ emoji: string; name: string; cd: number; last: number }> = [
      { emoji: "📅", name: "Daily",       cd: DAILY_COOLDOWN,   last: user.last_daily || 0 },
      { emoji: "💼", name: "Work",        cd: WORK_COOLDOWN,    last: user.last_work || 0 },
      { emoji: "⛏️", name: "Dig",         cd: DIG_COOLDOWN,     last: user.last_dig || 0 },
      { emoji: "🎣", name: "Fish",        cd: FISH_COOLDOWN,    last: user.last_fish || 0 },
      { emoji: "🙏", name: "Beg",         cd: BEG_COOLDOWN,     last: user.last_beg || 0 },
      { emoji: "🎰", name: "Slots",       cd: 300,              last: user.last_slots || 0 },
      { emoji: "🎲", name: "Dice",        cd: 120,              last: user.last_dice || 0 },
      { emoji: "🪙", name: "Coinflip",    cd: 120,              last: user.last_coinflip || 0 },
      { emoji: "🃏", name: "Casino",      cd: 420,              last: user.last_casino || 0 },
      { emoji: "🎯", name: "Doublebet",   cd: 240,              last: user.last_doublebet || 0 },
      { emoji: "💰", name: "Doublepayout",cd: 300,              last: user.last_doublepayout || 0 },
      { emoji: "🎡", name: "Roulette",    cd: 300,              last: user.last_roulette || 0 },
      { emoji: "🏇", name: "Horse",       cd: 240,              last: user.last_horse || 0 },
      { emoji: "🌀", name: "Spin",        cd: 180,              last: user.last_spin || 0 },
      { emoji: "🔫", name: "Steal",       cd: STEAL_COOLDOWN,   last: user.last_steal || 0 },
      { emoji: "🏰", name: "Raid",        cd: 21600,            last: rpg.last_raid || 0 },
      { emoji: "📜", name: "Quest",       cd: 240,              last: rpg.last_quest || 0 },
    ];
    const active = allCooldowns.filter((c) => now - c.last < c.cd);
    let text = `˗ˏˋ★ᯓ 𝗔𝗖𝗧𝗜𝗩𝗘 𝗖𝗢𝗢𝗟𝗗𝗢𝗪𝗡𝗦 ᯓ★ˎˊ˗\n`;
    if (active.length === 0) {
      text += `\n✅ *No active cooldowns!* You're all good to go.\n`;
    } else {
      text += "\n";
      for (const c of active) {
        const rem = c.cd - (now - c.last);
        text += `• \`${c.emoji} ${c.name}\`— \`${formatDuration(rem)}\` left\n`;
      }
    }
    await sendText(from, text);
    return;
  }

  if (cmd === "richlist") {
    const list = getRichList(from.endsWith("@g.us") ? from : undefined, 10);
    const MEDALS = ["🥇", "🥈", "🥉"];
    let text = "╔ ❰ 🏆 Gᴄ Rɪᴄʜʟɪsᴛ ❱ ╗\n║  💰 Tᴏᴘ Mᴇᴍʙᴇʀs\n║\n";
    list.forEach((u, i) => {
      const num = String(i + 1).padStart(2, "0");
      const medal = MEDALS[i];
      const name = u.name || extractNumberFromJid(u.id);
      const prefix = medal ? `${medal} ${num}.` : `${num}.`;
      text += `║ ${prefix} ${name}\n║     └─ 💰 Bᴀʟ: $${formatNumber(u.total)}\n║\n`;
    });
    text += "╚══════════════════╝";
    await ctx.sock.sendMessage(from, { text, mentions: list.map((u) => u.id) });
    return;
  }

  if (cmd === "richlistglobal" || cmd === "richlg") {
    const list = getRichList(undefined, 10);
    const MEDALS = ["🥇", "🥈", "🥉"];
    let text = "╔ ❰ 🏆 Gʟᴏʙᴀʟ Rɪᴄʜʟɪsᴛ ❱ ╗\n║ 🌍 Tᴏᴘ Pʟᴀʏᴇʀs\n║\n";
    list.forEach((u, i) => {
      const num = String(i + 1).padStart(2, "0");
      const medal = MEDALS[i];
      const name = u.name || extractNumberFromJid(u.id);
      const prefix = medal ? `${medal} ${num}.` : `${num}.`;
      text += `║ ${prefix} ${name}\n║     └─ 💰 Bᴀʟ: $${formatNumber(u.total)}\n║\n`;
    });
    text += "╚══════════════════╝";
    await ctx.sock.sendMessage(from, { text, mentions: list.map((u) => u.id) });
    return;
  }

  if (cmd === "register" || cmd === "reg") {
    if (user.registered) {
      await sendText(from, "✅ You're already registered.");
      return;
    }
    const phone = extractNumberFromJid(sender);
    updateUser(sender, { registered: 1, registered_at: now, balance: (user.balance || 0) + 45000, phone });
    await sendText(from,
      `*You're in.*\n\n` +
      `$45,000 dropped into your wallet.\n\n` +
      `Type *.p* to see your profile or *.help* for commands.`
    );
    return;
  }

  if (cmd === "setname") {
    const name = args.join(" ");
    if (!name) {
      await sendText(from, "❌ Usage: .setname <name>\n📃 Requires: *Rename Sheet📃* (buy from .shop for $91,000)\nName must be 2–20 characters.");
      return;
    }
    if (name.length < 2 || name.length > 20) {
      await sendText(from, "❌ Name must be between 2 and 20 characters.");
      return;
    }
    const inv = getInventory(sender);
    const sheet = inv.find((i) => i.item.toLowerCase().includes("rename sheet"));
    if (!sheet) {
      await sendText(from, "❌ You need a *Rename Sheet📃* to change your name.\nBuy one from the *.shop* for $91,000.");
      return;
    }
    removeFromInventory(sender, sheet.item);
    updateUser(sender, { name });
    await sendText(from, `✅ Name changed to: *${name}*\n📃 1 Rename Sheet consumed.`);
    return;
  }

  if (cmd === "setpp" || cmd === "setbg") {
    const media = await getCommandProfileMedia(ctx).catch(() => null);
    if (!media) {
      await sendText(from, `❌ Reply to an image/video/sticker or send media with .${cmd} as the caption.`);
      return;
    }
    const imageKey = cmd === "setpp" ? "profile_picture" : "profile_background";
    const videoKey = cmd === "setpp" ? "profile_picture_video" : "profile_background_video";
    const label = cmd === "setpp" ? "picture" : "background";
    if (media.type === "video") {
      if (!canSetProfileVideo(ctx, user)) {
        await sendText(from, "❌ Only owner, guardians, mods, group mods, and active premium users can set video profile media.");
        return;
      }
      const poster = await getVideoPoster(media.buffer).catch(() => null);
      const resizedPoster = poster
        ? await sharp(poster)
          .resize(cmd === "setpp" ? 640 : 765, cmd === "setpp" ? 640 : 850, { fit: "cover" })
          .jpeg({ quality: 92 })
          .toBuffer()
        : null;
      updateUser(sender, { [videoKey]: media.buffer, [imageKey]: resizedPoster });
      await sendText(from, `✅ Your animated profile ${label} has been updated.`);
      return;
    }
    const resized = await sharp(media.buffer)
      .resize(cmd === "setpp" ? 640 : 765, cmd === "setpp" ? 640 : 850, { fit: "cover" })
      .jpeg({ quality: 92 })
      .toBuffer();
    updateUser(sender, { [imageKey]: resized, [videoKey]: null });
    await sendText(from, `✅ Your profile ${label} has been updated.`);
    return;
  }

  // ... rest of the economy commands remain the same ...
  // (Profile, frame, bio, setage, inventory, shop, buy, sell, use, leaderboard, work, dig, fish, beg, steal, roast, stats, lc, bc)
}

function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
}

function randomDigFishReward(): number {
  return DIG_FISH_MIN_REWARD + Math.floor(Math.random() * (DIG_FISH_MAX_REWARD - DIG_FISH_MIN_REWARD + 1));
}

function getTotalXpScore(level: number, xp: number): number {
  let total = Math.max(0, Number(xp || 0));
  for (let lvl = 1; lvl < Math.max(1, Number(level || 1)); lvl++) {
    total += lvl * 100;
  }
  return total;
}

function getProfileRole(userId: string): string {
  const phone = extractNumberFromJid(userId);
  const staff = getStaff(userId);
  if (staff?.role === "owner") return "Owner";
  if (staff?.role === "guardian") return "Guardian";
  if (staff?.role === "mod") return "Mod";
  return "Ascendant";
}

function canSetProfileVideo(ctx: CommandContext, user: any): boolean {
  if (ctx.isOwner) return true;
  const staff = getStaff(ctx.sender);
  if (staff?.role === "guardian" || staff?.role === "mod") return true;
  if (ctx.from.endsWith("@g.us") && isMod(ctx.sender, ctx.from)) return true;
  if (!user?.premium) return false;
  const expiry = Number(user.premium_expiry || 0);
  return expiry === 0 || expiry > Math.floor(Date.now() / 1000);
}

function formatProfileDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Placeholder functions - these should be kept from the original economy.ts
// buildProfileImage, buildAnimatedProfileGif, extractVideoFrames, getVideoPoster, getProfileAvatar, getCommandProfileMedia, escapeXml
// ... add these from the original file ...
