import { jidDecode } from "@whiskeysockets/baileys";

/** Extract a reliable phone for user identity, even if LIDs are used. */
export function extractPhone(jid: string): string | null {
  if (!jid) return null;
  // Baileys LID support
  if (/:/.test(jid)) {
    const decoded = jidDecode(jid);
    return decoded?.user || null;
  }
  // Regular JID
  if (jid.includes("@")) return jid.split("@")[0];
  // fallback
  return jid.replace(/\D/g, "");
}

/**
 * Example usage:
 *   const phone = extractPhone(m.sender);
 */
