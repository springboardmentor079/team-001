import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../shared/db';
import { ok } from '../../shared/http';
import { rolePermissions } from '../../shared/permissions';
import { authenticate } from '../auth/auth.middleware';
import { projectScope } from '../projects/project-access';

export const searchRouter = Router();
searchRouter.use(authenticate);

searchRouter.get('/', async (req, res) => {
  const { q } = z
    .object({ q: z.string().trim().min(2).max(100) })
    .strict()
    .parse(req.query);
  const actor = req.identity!;
  const permissions = rolePermissions[actor.role];
  const contains = { contains: q, mode: 'insensitive' as const };
  const [projects, workers, materials, vendors, orders, equipment] = await Promise.all([
    permissions.includes('PROJECT_VIEW')
      ? db.project.findMany({
          where: {
            ...projectScope(actor),
            OR: [{ name: contains }, { code: contains }, { city: contains }],
          },
          select: { id: true, code: true, name: true, city: true, status: true },
          orderBy: { name: 'asc' },
          take: 6,
        })
      : [],
    permissions.includes('WORKFORCE_VIEW')
      ? db.workerProfile.findMany({
          where: {
            organizationId: actor.organizationId,
            active: true,
            OR: [{ name: contains }, { employeeCode: contains }, { category: contains }],
          },
          select: { id: true, employeeCode: true, name: true, category: true, status: true },
          orderBy: { name: 'asc' },
          take: 6,
        })
      : [],
    permissions.includes('INVENTORY_VIEW')
      ? db.material.findMany({
          where: {
            organizationId: actor.organizationId,
            active: true,
            OR: [{ name: contains }, { sku: contains }, { category: contains }],
          },
          select: { id: true, sku: true, name: true, category: true },
          orderBy: { name: 'asc' },
          take: 6,
        })
      : [],
    permissions.includes('PROCUREMENT_VIEW')
      ? db.vendor.findMany({
          where: {
            organizationId: actor.organizationId,
            OR: [{ name: contains }, { code: contains }, { contactName: contains }],
          },
          select: { id: true, code: true, name: true, contactName: true, status: true },
          orderBy: { name: 'asc' },
          take: 6,
        })
      : [],
    permissions.includes('PROCUREMENT_VIEW')
      ? db.purchaseOrder.findMany({
          where: {
            organizationId: actor.organizationId,
            OR: [
              { number: contains },
              { vendor: { name: contains } },
              { material: { name: contains } },
            ],
          },
          select: {
            id: true,
            number: true,
            status: true,
            vendor: { select: { name: true } },
            material: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 6,
        })
      : [],
    permissions.includes('RESOURCE_VIEW')
      ? db.equipment.findMany({
          where: {
            organizationId: actor.organizationId,
            active: true,
            OR: [
              { name: contains },
              { code: contains },
              { type: contains },
              { location: contains },
            ],
          },
          select: { id: true, code: true, name: true, type: true, status: true },
          orderBy: { name: 'asc' },
          take: 6,
        })
      : [],
  ]);
  return ok(res, [
    ...projects.map((item) => ({
      id: item.id,
      category: 'Project',
      title: item.name,
      metadata: `${item.code} · ${item.city} · ${item.status}`,
      route: `/projects/${item.id}`,
    })),
    ...workers.map((item) => ({
      id: item.id,
      category: 'Worker',
      title: item.name,
      metadata: `${item.employeeCode} · ${item.category} · ${item.status}`,
      route: '/workforce',
    })),
    ...materials.map((item) => ({
      id: item.id,
      category: 'Material',
      title: item.name,
      metadata: `${item.sku} · ${item.category}`,
      route: '/inventory',
    })),
    ...vendors.map((item) => ({
      id: item.id,
      category: 'Vendor',
      title: item.name,
      metadata: `${item.code}${item.contactName ? ` · ${item.contactName}` : ''} · ${item.status}`,
      route: '/procurement',
    })),
    ...orders.map((item) => ({
      id: item.id,
      category: 'Purchase order',
      title: item.number,
      metadata: `${item.vendor.name} · ${item.material.name} · ${item.status}`,
      route: '/procurement',
    })),
    ...equipment.map((item) => ({
      id: item.id,
      category: 'Equipment',
      title: item.name,
      metadata: `${item.code} · ${item.type} · ${item.status}`,
      route: '/equipment',
    })),
  ]);
});
