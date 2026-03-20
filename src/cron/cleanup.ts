import { prisma } from "../config/db.js";
import { deleteFile } from "../services/upload.service.js";

const ORPHAN_TTL_MS = 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

async function cleanOrphanAttachments() {
  const cutoff = new Date(Date.now() - ORPHAN_TTL_MS);

  const orphans = await prisma.attachment.findMany({
    where: { messageId: null, createdAt: { lt: cutoff } },
    select: { id: true, url: true },
  });

  if (orphans.length === 0) return;

  for (const orphan of orphans) {
    await deleteFile(orphan.url).catch(() => {});
  }

  await prisma.attachment.deleteMany({
    where: { id: { in: orphans.map((o) => o.id) } },
  });

  console.log(`[cleanup] ${orphans.length} attachments orphelins supprimés`);
}

export function startCleanupCron() {
  cleanOrphanAttachments();
  setInterval(cleanOrphanAttachments, CLEANUP_INTERVAL_MS);
}
