import type { CommandContext } from "./index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "../db/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function handleMenu(ctx: CommandContext): Promise<void> {
  const { from, sender, sock } = ctx;
  const { getMentionName: menuGetName } = await import("../db/queries.js");
  const senderPhone = menuGetName(sender);

  const menuText =
`┌─⟡ 『 𝗧𝗘𝗡𝗞𝗨 天空 』⟡
║
║ ┌──────────────────────
║ ║ 👋 𝗛𝗲𝘆       : @${senderPhone}
║ ║ 🌌 𝗕𝗼𝘁       : Tenku
║ ║ 👑 𝗖𝗿𝗲𝗮𝘁𝗼𝗿  : Natsuki
║ ║ 🔹 𝗣𝗿𝗲𝗳𝗶𝘅   : [ . ]
║ └──────────────────────
║
╠─⟡ 📋 𝗠𝗔𝗜𝗡
║ ┌──────────────────────
║ ║ ➩ .menu
║ ║ ➩ .ping
║ ║ ➩ .website
║ ║ ➩ .community
║ ║ ➩ .bots
║ ║ ➩ .afk
║ ║ ➩ .help / .info
║ ║ ➩ .uptime
║ └──────────────────────
║
╠─⟡ ⚙️ 𝗔𝗗𝗠𝗜𝗡
║ ┌──────────────────────
║ ║ ➩ .kick
║ ║ ➩ .delete
║ ║ ➩ .antilink set [action]
║ ║ ➩ .warn @user [reason]
║ ║ ➩ .resetwarn
║ ║ ➩ .groupinfo / .gi
║ ║ ➩ .welcome on/off
║ ║ ➩ .setwelcome / .setleave
║ ║ ➩ .promote / .demote
║ ║ ➩ .mute / .unmute
║ ║ ➩ .hidetag / .tagall
║ ║ ➩ .open / .close
║ ║ ➩ .purge [code]
║ ║ ➩ .antism on/off
║ ║ ➩ .blacklist add/remove/list
║ ║ ➩ .groupstats / .gs
║ └──────────────────────
║
╠─⟡ 💰 𝗘𝗖𝗢𝗡𝗢𝗠𝗬
║ ┌──────────────────────
║ ║ ➩ .bal / .balance
║ ║ ➩ .gems / .premiumbal
║ ║ ➩ .premium / .membership
║ ║ ➩ .daily
║ ║ ➩ .withdraw / .deposit
║ ║ ➩ .donate [amount]
║ ║ ➩ .richlist / .richlg
║ ║ ➩ .register / .reg
║ ║ ➩ .setname <name>
║ ║ ➩ .setpp / .setbg
║ ║ ➩ .profile / .p
║ ║ ➩ .bio [text] / .setage [age]
║ ║ ➩ .inventory / .shop / .buy
║ ║ ➩ .leaderboard / .lb
║ ║ ➩ .work / .dig / .fish / .beg
║ ║ ➩ .steal / .roast
║ ║ ➩ .stats / .cds
║ └──────────────────────
║
╠─⟡ 🎴 𝗖𝗔𝗥𝗗𝗦
║ ┌──────────────────────
║ ║ ➩ .collection / .coll
║ ║ ➩ .deck / .sdi
║ ║ ➩ .card [index]
║ ║ ➩ .cardinfo / .ci <name>
║ ║ ➩ .si <name>
║ ║ ➩ .slb <series>
║ ║ ➩ .mycollectionseries
║ ║ ➩ .cardleaderboard / .cardlb
║ ║ ➩ .cardshop / .stardust
║ ║ ➩ .get [id]
║ ║ ➩ .vs @user
║ ║ ➩ .auction / .myauc
║ ║ ➩ .listauc / .bid [id] [amt]
║ ║ ➩ .cg @user
║ ║ ➩ .ctd / .lcd / .retrieve
║ ║ ➩ .sellc / .tc
║ ║ ➩ .accept / .decline
║ └──────────────────────
║
╠─⟡ 🎮 𝗚𝗔𝗠𝗘𝗦
║ ┌──────────────────────
║ ║ ➩ .tictactoe / .ttt
║ ║ ➩ .connectfour / .c4
║ ║ ➩ .wcg / .wordchain
║ ║ ➩ .startbattle
║ ║ ➩ .truthordare / .td
║ ║ ➩ .stopgame
║ └──────────────────────
║
╠─⟡ 🃏 𝗨𝗡𝗢
║ ┌──────────────────────
║ ║ ➩ .uno / .startuno
║ ║ ➩ .unoplay / .unodraw
║ ║ ➩ .unohand
║ └──────────────────────
║
╠─⟡ 🎲 𝗚𝗔𝗠𝗕𝗟𝗘
║ ┌──────────────────────
║ ║ ➩ .slots / .dice / .casino
║ ║ ➩ .coinflip / .cf
║ ║ ➩ .doublebet / .doublepayout
║ ║ ➩ .roulette / .horse / .spin
║ └──────────────────────
║
╠─⟡ 🎭 𝗙𝗨𝗡
║ ┌──────────────────────
║ ║ ➩ .fancy <1-35> <text>
║ ║ ➩ .gay / .lesbian / .simp
║ ║ ➩ .match / .ship / .relation
║ ║ ➩ .character / .psize / .pp
║ ║ ➩ .skill / .duality / .gen
║ ║ ➩ .pov / .social
║ ║ ➩ .wouldyourather / .wyr
║ ║ ➩ .joke
║ └──────────────────────
║
╠─⟡ 👤 𝗜𝗡𝗧𝗘𝗥𝗔𝗖𝗧𝗜𝗢𝗡
║ ┌──────────────────────
║ ║ ➩ .hug / .kiss / .slap
║ ║ ➩ .wave / .pat / .dance
║ ║ ➩ .sad / .smile / .laugh
║ ║ ➩ .punch / .kill / .hit
║ ║ ➩ .kidnap / .lick / .bonk
║ ║ ➩ .tickle / .shrug
║ └──────────────────────
║
╚══════════════════════════╝
  🌌 _The sky is not the limit — it is the beginning. 天空_`;

  try {
    const db = getDb();
    const bot = db.prepare("SELECT menu_image_url FROM bots WHERE is_primary = 1").get() as any;
    const imageUrl = bot?.menu_image_url;

    if (imageUrl && fs.existsSync(imageUrl)) {
      const imageBuffer = fs.readFileSync(imageUrl);
      await sock.sendMessage(from, {
        image: imageBuffer,
        caption: menuText,
        mentions: [sender],
      });
    } else {
      await sock.sendMessage(from, {
        text: menuText,
        mentions: [sender],
      });
    }
  } catch {
    await sock.sendMessage(from, {
      text: menuText,
      mentions: [sender],
    });
  }
}

export async function handleInfo(ctx: CommandContext): Promise<void> {
  const { from, sender, sock } = ctx;
  const uptime = process.uptime();
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);

  const db = getDb();
  const groupCount = (db.prepare("SELECT COUNT(*) as c FROM groups").get() as any)?.c || 0;
  const userCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE registered = 1 AND COALESCE(is_bot, 0) = 0").get() as any)?.c || 0;

  const info = `🌌 *Tenku Bot — 天空*\n\n` +
    `🌌 Bot: ${ctx.sock.user?.name || "Tenku"}\n` +
    `👑 Creator: Natsuki\n` +
    `🔹 Prefix: [ . ]\n` +
    `📡 Status: Online ✅\n` +
    `⏱️ Uptime: ${h}h ${m}m ${s}s\n` +
    `🏘️ Active Groups: ${groupCount}\n` +
    `👥 Registered Users: ${userCount}\n` +
    `🌌 Tenku — Heavenly Sky`;

  await sock.sendMessage(from, { text: info, mentions: [sender] });
}
