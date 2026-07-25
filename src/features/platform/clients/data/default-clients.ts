import type { TenantClient } from "@/features/platform/clients/types"

export const defaultTenantClients: TenantClient[] = [
  {
    id: "tenant-northstar",
    businessName: "Northstar Market",
    slug: "northstar-market",
    adminEmail: "owner@northstar.co",
    phone: "+57 300 111 2233",
    status: "active",
    createdAt: "2026-04-11T09:15:00.000Z",
  },
  {
    id: "tenant-harbor",
    businessName: "Harbor Cafe",
    slug: "harbor-cafe",
    adminEmail: "owner@northstar.co",
    phone: "+57 300 555 4411",
    status: "active",
    createdAt: "2026-04-19T14:40:00.000Z",
  },
  {
    id: "tenant-luna",
    businessName: "Luna Foods",
    slug: "luna-foods",
    adminEmail: "manager@lunafoods.co",
    phone: "+57 301 222 8844",
    status: "active",
    createdAt: "2026-05-03T11:20:00.000Z",
  },
  {
    id: "tenant-summit",
    businessName: "Summit Retail",
    slug: "summit-retail",
    adminEmail: "admin@summitretail.co",
    phone: "+57 320 456 7890",
    status: "inactive",
    createdAt: "2026-05-17T16:05:00.000Z",
  },
]
