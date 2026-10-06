import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { db } from '../../shared/db';
import { HttpError, ok } from '../../shared/http';
import { authenticate, requirePermission } from '../auth/auth.middleware';
import { accessProject, projectAudit, projectScope } from '../projects/project-access';

export const documentsRouter = Router();
documentsRouter.use(authenticate, requirePermission('DOCUMENT_VIEW'));
const storageRoot = path.resolve(process.cwd(), '.local', 'uploads');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
const allowed = new Set(['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
function validSignature(file: Express.Multer.File) {
  const hex = file.buffer.subarray(0, 8).toString('hex');
  if (file.mimetype === 'application/pdf') return file.buffer.subarray(0, 4).toString() === '%PDF';
  if (file.mimetype === 'image/png') return hex.startsWith('89504e470d0a1a0a');
  if (file.mimetype === 'image/jpeg') return hex.startsWith('ffd8ff');
  return hex.startsWith('504b0304');
}
const include = { project: { select: { id: true, name: true } }, versions: { select: { id: true, version: true, filename: true, mimeType: true, size: true, checksum: true, createdAt: true, uploadedBy: { select: { id: true, name: true } } }, orderBy: { version: 'desc' as const } } };
documentsRouter.get('/', async (req, res) => {
  const documents = await db.document.findMany({ where: { project: projectScope(req.identity!) }, include, orderBy: { createdAt: 'desc' } });
  return ok(res, documents);
});
documentsRouter.post('/', requirePermission('DOCUMENT_UPLOAD'), upload.single('file'), async (req, res) => {
  const actor = req.identity!, file = req.file;
  if (!file) throw new HttpError(422, 'Choose a file to upload.');
  if (!allowed.has(file.mimetype) || !validSignature(file)) throw new HttpError(422, 'File type or content is not allowed.');
  const input = z.object({ projectId: z.uuid(), title: z.string().trim().min(2).max(180), category: z.string().trim().min(2).max(100), documentId: z.union([z.uuid(), z.literal('')]).optional() }).parse(req.body);
  await db.$transaction((tx) => accessProject(tx, input.projectId, actor, 'DOCUMENT_UPLOAD'));
  let documentId = input.documentId || null;
  if (documentId) {
    const existing = await db.document.findFirst({ where: { id: documentId, projectId: input.projectId, organizationId: actor.organizationId } });
    if (!existing) throw new HttpError(404, 'Document not found.');
  }
  await mkdir(storageRoot, { recursive: true });
  const extension = path.extname(file.originalname).toLowerCase().slice(0, 10), storageName = `${randomUUID()}${extension}`, storagePath = path.join(storageRoot, storageName);
  await writeFile(storagePath, file.buffer, { flag: 'wx' });
  try {
    const document = await db.$transaction(async (tx) => {
      if (documentId) await tx.$queryRaw`SELECT id FROM documents WHERE id=${documentId}::uuid FOR UPDATE`;
      const parent = documentId ? await tx.document.update({ where: { id: documentId }, data: { title: input.title, category: input.category } }) : await tx.document.create({ data: { organizationId: actor.organizationId, projectId: input.projectId, title: input.title, category: input.category } });
      documentId = parent.id;
      const latest = await tx.documentVersion.aggregate({ where: { documentId: parent.id }, _max: { version: true } });
      const version = (latest._max.version || 0) + 1;
      await tx.documentVersion.create({ data: { documentId: parent.id, version, filename: path.basename(file.originalname), mimeType: file.mimetype, size: file.size, storagePath, checksum: createHash('sha256').update(file.buffer).digest('hex'), uploadedById: actor.id } });
      const members = await tx.projectMember.findMany({ where: { projectId: input.projectId, userId: { not: actor.id } }, select: { userId: true } });
      if (members.length) await tx.notification.createMany({ data: members.map(({ userId }) => ({ organizationId: actor.organizationId, userId, type: 'DOCUMENT_UPLOADED', title: `Document updated: ${input.title}`, message: `${actor.name} uploaded version ${version} in ${input.category}.`, entityType: 'Document', entityId: parent.id })) });
      await projectAudit(tx, actor, 'DOCUMENT_VERSION_UPLOADED', 'Project', input.projectId);
      return tx.document.findUniqueOrThrow({ where: { id: parent.id }, include });
    });
    return ok(res, document, document.versions.length === 1 ? 'Document uploaded.' : 'Document version uploaded.', 201);
  } catch (error) {
    await unlink(storagePath).catch(() => undefined);
    throw error;
  }
});
documentsRouter.get('/versions/:id/download', async (req, res) => {
  const id = z.uuid().parse(req.params.id), actor = req.identity!;
  const version = await db.documentVersion.findFirst({ where: { id, document: { organizationId: actor.organizationId, project: projectScope(actor) } }, include: { document: true } });
  if (!version) throw new HttpError(404, 'Document version not found.');
  const bytes = await readFile(version.storagePath).catch(() => null);
  if (!bytes) throw new HttpError(404, 'Stored document file is unavailable.');
  res.setHeader('Content-Type', version.mimeType);
  res.setHeader('Content-Length', bytes.length);
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(version.filename)}`);
  return res.send(bytes);
});
