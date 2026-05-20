import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { getDb } from "./db/database.js";
import { logger } from "../lib/logger.js";
import fs from "fs";
import Pino from "pino";

export interface BotStatusInfo {
  id: string;
  name: string;
  phone: string;
  status: "disconnected" | "connecting" | "pairing" | "connected";
  pairingCode: string | null;
  isPrimary: boolean;
  imageUrl: string;
}

interface LiveInstance {
  sock: any;
  status: BotStatusInfo["status"];
  pairingCode: string | null;
}

const live = new Map<string, LiveInstance>();

export async function startBot(botId: string): Promise<void> {
  const existing = live.get(botId);
  if (existing && (existing.status === "connected" || existing.status === "connecting" || existing.status === "pairing")) {
    return;
  }

  const db = getDb();
  const row = db.prepare("SELECT * FROM bots WHERE id = ?").get(botId) as any;
  if (!row) throw new Error(`Bot ${botId} not found`);

  const authDir = row.auth_dir || `data/bots/${botId}/auth`;
  fs.mkdirSync(authDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();
  const silent = Pino({ level: "silent" }) as any;

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, silent),
    },
    printQRInTerminal: false,
    logger: silent,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    browser: ["Ubuntu", "Chrome", "22.04.4"],
  });

  const inst: LiveInstance = { sock, status: "connecting", pairingCode: null };
  live.set(botId, inst);
  db.prepare("UPDATE bots SET status = 'connecting' WHERE id = ?").run(botId);

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update: any) => {
    if (update.pairingCode) {
      inst.pairingCode = update.pairingCode;
      inst.status = "pairing";
      db.prepare("UPDATE bots SET status = 'pairing' WHERE id = ?").run(botId);
      logger.info({ botId, code: update.pairingCode }, "Pairing code ready for managed bot");
    }

    if (update.connection === "open") {
      inst.status = "connected";
      inst.pairingCode = null;
      const phone = sock.user?.id?.split("@")[0]?.split(":")[0] || row.phone;
      db.prepare("UPDATE bots SET status = 'connected', phone = ? WHERE id = ?").run(phone, botId);
      logger.info({ botId, name: row.name }, "Managed bot connected");
    }

    if (update.connection === "close") {
      const code = (update.lastDisconnect?.error as any)?.output?.statusCode;
      inst.status = "disconnected";
      db.prepare("UPDATE bots SET status = 'disconnected' WHERE id = ?").run(botId);
      logger.info({ botId, code }, "Managed bot disconnected");
      if (code !== DisconnectReason.loggedOut) {
        setTimeout(() => startBot(botId).catch(() => {}), 8000);
      } else {
        live.delete(botId);
      }
    }
  });

  if (!state.creds.registered && row.phone) {
    try {
      await new Promise((r) => setTimeout(r, 3000));
      const phoneDigits = row.phone.replace(/\D/g, "");
      if (phoneDigits.length >= 7) {
        const code = await sock.requestPairingCode(phoneDigits);
        inst.pairingCode = code;
        inst.status = "pairing";
        db.prepare("UPDATE bots SET status = 'pairing' WHERE id = ?").run(botId);
        logger.info({ botId, code }, "Pairing code generated");
      }
    } catch (err) {
      logger.warn({ err, botId }, "Could not get pairing code for managed bot");
    }
  }
}

export async function stopBot(botId: string): Promise<void> {
  const inst = live.get(botId);
  if (!inst) return;
  try { await inst.sock?.logout(); } catch {}
  inst.status = "disconnected";
  live.delete(botId);
  const db = getDb();
  db.prepare("UPDATE bots SET status = 'disconnected' WHERE id = ?").run(botId);
}

export async function disconnectBot(botId: string): Promise<void> {
  const inst = live.get(botId);
  if (!inst) return;
  try { inst.sock?.end(undefined); } catch {}
  inst.status = "disconnected";
  live.delete(botId);
  const db = getDb();
  db.prepare("UPDATE bots SET status = 'disconnected' WHERE id = ?").run(botId);
}

export function getAllBotsStatus(): BotStatusInfo[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM bots ORDER BY is_primary DESC, created_at ASC").all() as any[];
  return rows.map((row) => {
    const inst = live.get(row.id);
    return {
      id: row.id,
      name: row.name,
      phone: row.phone || "",
      status: (inst?.status || row.status || "disconnected") as BotStatusInfo["status"],
      pairingCode: inst?.pairingCode || null,
      isPrimary: !!row.is_primary,
      imageUrl: row.menu_image_url || row.image_url || "",
    };
  });
}

export function getBotStatusInfo(botId: string): BotStatusInfo | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM bots WHERE id = ?").get(botId) as any;
  if (!row) return null;
  const inst = live.get(botId);
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || "",
    status: (inst?.status || row.status || "disconnected") as BotStatusInfo["status"],
    pairingCode: inst?.pairingCode || null,
    isPrimary: !!row.is_primary,
    imageUrl: row.menu_image_url || row.image_url || "",
  };
}

export function setPrimaryBot(botId: string): void {
  const db = getDb();
  db.prepare("UPDATE bots SET is_primary = 0").run();
  db.prepare("UPDATE bots SET is_primary = 1 WHERE id = ?").run(botId);
}

export async function initManagedBots(): Promise<void> {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM bots").all() as any[];
  for (const row of rows) {
    if (row.is_primary || row.status === "connected") {
      startBot(row.id).catch((err) =>
        logger.warn({ err, id: row.id }, "Failed to auto-start managed bot")
      );
    }
  }
}
