import { Router } from "express";
import { randomBytes } from "crypto";
import { getDb } from "../../bot/db/database.js";
import { getAnySock, isSocketConnected } from "../../bot/connection.js";
import { logger } from "../../lib/logger.js";

const router = Router();

const OTP_EXPIRY_SECONDS = 300;

function ensureWebTables() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS web_otps (
      phone TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS web_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()),
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS web_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon TEXT DEFAULT 'star',
      earned_at INTEGER DEFAULT (unixepoch())
    );
  `);
}

ensureWebTables();

function normalizePhone(raw: string): string | null {
  const cleaned = raw.replace(/\D/g, "");
  if (cleaned.length < 7 || cleaned.length > 15) return null;
  return cleaned;
}

function getUserByPhone(phone: string) {
  const db = getDb();
  const row = db.prepare(
    "SELECT * FROM users WHERE id = ? OR phone = ? LIMIT 1"
  ).get(phone, phone) as any;
  return row || null;
}

router.post("/otp/send", async (req, res) => {
  const { phone } = req.body as { phone?: string };
  if (!phone) {
    res.status(400).json({ success: false, message: "Phone number is required" });
    return;
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    res.status(400).json({ success: false, message: "Invalid phone number format" });
    return;
  }

  const user = getUserByPhone(normalized);
  if (!user) {
    res.status(404).json({
      success: false,
      message: "Phone number not found. Please register on the website first.",
      registerRedirect: true,
    });
    return;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Math.floor(Date.now() / 1000) + OTP_EXPIRY_SECONDS;

  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO web_otps (phone, code, expires_at) VALUES (?, ?, ?)").run(normalized, code, expiresAt);

  const activeSock = getAnySock();
  if (activeSock && isSocketConnected()) {
    try {
      const jid = `${normalized}@s.whatsapp.net`;
      await activeSock.sendMessage(jid, {
        text: `*Tenku 天空* — Your login code:\n\n*${code}*\n\nThis code expires in 5 minutes. Do not share it with anyone.`,
      });
      logger.info({ phone: normalized }, "OTP sent via WhatsApp");
    } catch (err) {
      logger.error({ err }, "Failed to send OTP via WhatsApp");
      res.status(500).json({ success: false, message: "Failed to send OTP. Bot may be offline." });
      return;
    }
  } else {
    logger.warn("Bot not connected, cannot send OTP DM");
    res.status(500).json({ success: false, message: "Bot is currently offline. Please try again later." });
    return;
  }

  res.json({ success: true, message: "OTP sent to your WhatsApp" });
});

router.post("/register", async (req, res) => {
  const { phone, name } = req.body as { phone?: string; name?: string };

  if (!phone || !name) {
    res.status(400).json({ success: false, message: "Phone number and name are required" });
    return;
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    res.status(400).json({ success: false, message: "Invalid phone number format" });
    return;
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    res.status(400).json({ success: false, message: "Name must be at least 2 characters" });
    return;
  }

  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  const existing = getUserByPhone(normalized);
  if (existing && existing.registered) {
    res.status(409).json({
      success: false,
      message: "This number is already registered. Please log in instead.",
      loginRedirect: true,
    });
    return;
  }

  if (!existing) {
    // Use the plain phone number as the canonical user ID — never the JID
    db.prepare(
      "INSERT OR IGNORE INTO users (id, name, phone, registered, registered_at, created_at, balance) VALUES (?, ?, ?, 1, ?, ?, 45000)"
    ).run(normalized, trimmedName, normalized, now, now);
  } else {
    // Migrate any old JID-keyed row to the plain phone number key
    const existingPhone = existing.id.split("@")[0].split(":")[0];
    if (existingPhone !== existing.id) {
      // Old row had JID as id — update to plain phone
      db.prepare("UPDATE users SET id = ?, name = ?, phone = ?, registered = 1, registered_at = ? WHERE id = ?")
        .run(normalized, trimmedName, normalized, now, existing.id);
    } else {
      db.prepare(
        "UPDATE users SET name = ?, phone = ?, registered = 1, registered_at = ? WHERE id = ?"
      ).run(trimmedName, normalized, now, normalized);
    }
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = now + OTP_EXPIRY_SECONDS;
  db.prepare("INSERT OR REPLACE INTO web_otps (phone, code, expires_at) VALUES (?, ?, ?)").run(normalized, code, expiresAt);

  const activeSock = getAnySock();
  if (activeSock && isSocketConnected()) {
    try {
      await activeSock.sendMessage(`${normalized}@s.whatsapp.net`, {
        text: `*Tenku 天空* — Welcome, ${trimmedName}!\n\nYour registration code:\n\n*${code}*\n\nExpires in 5 minutes. Don't share this code.`,
      });
    } catch (err) {
      logger.error({ err }, "Failed to send registration OTP");
      res.status(500).json({ success: false, message: "Failed to send OTP via WhatsApp. Bot may be offline." });
      return;
    }
  } else {
    res.status(500).json({ success: false, message: "Bot is currently offline. Please try again later." });
    return;
  }

  res.json({ success: true, message: "Account created! Check your WhatsApp for the verification code." });
});

router.post("/otp/verify", (req, res) => {
  const { phone, code } = req.body as { phone?: string; code?: string };
  if (!phone || !code) {
    res.status(400).json({ success: false, message: "Phone and code are required" });
    return;
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    res.status(400).json({ success: false, message: "Invalid phone number" });
    return;
  }

  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const otp = db.prepare("SELECT * FROM web_otps WHERE phone = ?").get(normalized) as any;

  if (!otp) {
    res.status(401).json({ success: false, message: "No OTP found. Please request a new code." });
    return;
  }

  if (otp.expires_at < now) {
    db.prepare("DELETE FROM web_otps WHERE phone = ?").run(normalized);
    res.status(401).json({ success: false, message: "OTP has expired. Please request a new code." });
    return;
  }

  if (otp.code !== code.trim()) {
    res.status(401).json({ success: false, message: "Incorrect code. Please try again." });
    return;
  }

  db.prepare("DELETE FROM web_otps WHERE phone = ?").run(normalized);

  const user = getUserByPhone(normalized);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found." });
    return;
  }

  // Always use the plain phone number as the session user_id
  const token = randomBytes(32).toString("hex");
  const sessionExpiry = now + 30 * 24 * 3600;
  db.prepare("INSERT INTO web_sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, normalized, sessionExpiry);

  const BOT_OWNER = (process.env["BOT_OWNER_LID"] || "2348144550593").replace(/\D/g, "");
  const isOwner = normalized === BOT_OWNER;
  const staffRow = db.prepare("SELECT 1 FROM staff WHERE user_id = ?").get(normalized);
  const isMod = isOwner || !!staffRow ? 1 : 0;

  res.json({
    success: true,
    token,
    user: {
      id: normalized,
      name: user.name || "Shadow",
      phone: normalized,
      level: user.level || 1,
      xp: user.xp || 0,
      balance: user.balance || 0,
      bank: user.bank || 0,
      premium: user.premium || 0,
      bio: user.bio || "",
      registeredAt: user.created_at || 0,
      isMod,
      isOwner,
    },
  });
});

export { router as authRouter };
