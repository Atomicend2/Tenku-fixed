import type { CommandContext } from "./index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "../db/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function handleMenu(ctx: CommandContext): Promise<void> {
  const { from, sender, sock } = ctx;
  const senderPhone = sender.split("@")[0]?.split(":")[0] || sender;

  const menuText = `╭━━━〔 天空 • TENKU 〕━━━⬣
┃
┃ ✦ User     : @${senderPhone}
┃ ✦ Bot      : Tenku
┃ ✦ Creator  : Natsuki
┃ ✦ Prefix   : [ . ]
┃
┣━━━〔 📋 MAIN 〕━━━⬣
┃ • .menu
┃ • .ping
┃ • .website
┃ • .community
┃ • .afk
┃ • .help
┃ • .info
┃ • .uptime
┃
┣━━━〔 ⚙️ ADMIN 〕━━━⬣
┃ • .kick
┃ • .delete
┃ • .antilink
┃ • .antilink set [action]
┃ • .warn @user [reason]
┃ • .resetwarn
┃ • .groupinfo / .gi
┃ • .welcome on/off
┃ • .setwelcome
┃ • .leave on/off
┃ • .setleave
┃ • .promote
┃ • .demote
┃ • .mute
┃ • .unmute
┃ • .hidetag
┃ • .tagall
┃ • .activity
┃ • .active
┃ • .inactive
┃ • .open
┃ • .close
┃ • .purge [code]
┃ • .antism on/off
┃ • .blacklist add [word]
┃ • .blacklist remove [word]
┃ • .blacklist list
┃ • .groupstats / .gs
┃
┣━━━〔 💰 ECONOMY 〕━━━⬣
┃ • .bal / .balance
┃ • .gems
┃ • .premiumbal / .pbal
┃ • .premium / .prem
┃ • .membership / .memb
┃ • .daily
┃ • .withdraw / .wid [amount]
┃ • .deposit / .dep [amount]
┃ • .donate [amount]
┃ • .lottery
┃ • .lp
┃ • .richlist
┃ • .richlistglobal / .richlg
┃ • .register / .reg
┃ • .setname <name>
┃ • .setpp
┃ • .setbg
┃ • .profile / .p
┃ • .bio [bio]
┃ • .setage [age]
┃ • .inventory / .inv
┃ • .use [item]
┃ • .sell [item]
┃ • .buy [item]
┃ • .shop
┃ • .leaderboard / .lb
┃ • .work
┃ • .dig
┃ • .fish
┃ • .beg
┃ • .roast
┃ • .cds
┃ • .stats
┃ • .lc
┃ • .bc
┃
┣━━━〔 🎴 CARDS 〕━━━⬣
┃ • .collection / .coll
┃ • .deck
┃ • .sdi
┃ • .card [index]
┃ • .cardinfo / .ci
┃ • .mycollectionseries
┃ • .cardleaderboard
┃ • .cardshop
┃ • .get [id]
┃ • .stardust
┃ • .vs @user
┃ • .auction
┃ • .myauc
┃ • .listauc
┃ • .cg @user
┃ • .spawncard
┃ • .ctd
┃ • .lcd
┃ • .retrieve
┃ • .sellc
┃ • .tc
┃ • .accept / .decline
┃
┣━━━〔 🎮 GAMES 〕━━━⬣
┃ • .tictactoe / .ttt
┃ • .connectfour / .c4
┃ • .wcg
┃ • .wordchain
┃ • .startbattle
┃ • .truthordare / .td
┃ • .stopgame
┃
┣━━━〔 🃏 UNO 〕━━━⬣
┃ • .uno
┃ • .startuno
┃ • .unoplay
┃ • .unodraw
┃ • .unohand
┃
┣━━━〔 🎲 GAMBLE 〕━━━⬣
┃ • .slots
┃ • .dice
┃ • .casino
┃ • .coinflip / .cf
┃ • .doublebet
┃ • .doublepayout
┃ • .roulette
┃ • .horse
┃ • .spin
┃
┣━━━〔 👤 INTERACTION 〕━━━⬣
┃ • .hug
┃ • .kiss
┃ • .slap
┃ • .wave
┃ • .pat
┃ • .dance
┃ • .sad
┃ • .smile
┃ • .laugh
┃ • .punch
┃ • .kill
┃ • .hit
┃ • .kidnap
┃ • .lick
┃ • .bonk
┃ • .tickle
┃ • .shrug
┃
╰━━━〔 🌌 The sky is not the limit — it is the beginning. 天空 〕━━━⬣`;

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
