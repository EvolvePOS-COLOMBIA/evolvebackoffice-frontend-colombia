import type { ReleaseVersion, SoftwareProduct, UserAccount } from "@/types/domain"

function createId() {
  return crypto.randomUUID()
}

const softwareA = createId()
const softwareB = createId()
const versionA = createId()
const versionB = createId()
const versionC = createId()
const adminUserId = createId()

export const initialSoftwareProducts: SoftwareProduct[] = [
  {
    id: softwareA,
    name: "EvolvePOS BackOffice",
    description:
      "Internal operations panel for pricing, inventory, reporting, and release distribution.",
    code: "SW-EVOLVEPOS",
    createdAt: "2026-05-15T09:00:00.000Z",
  },
  {
    id: softwareB,
    name: "Evolve Installer",
    description:
      "Installer client that connects to the central API to validate channel access and download binaries.",
    code: "SW-EVOLVEINSTALLER",
    createdAt: "2026-05-27T10:30:00.000Z",
  },
]

export const initialReleaseVersions: ReleaseVersion[] = [
  {
    id: versionA,
    softwareId: softwareA,
    versionNumber: "1.3.0.0",
    summary:
      "Release focused on operational stability, cash closing improvements, and stronger synchronization flows.",
    releaseChannel: "Production",
    isCritical: true,
    releaseDate: "2026-06-09",
    zipFilePath: "/mock-storage/evolvepos-backoffice-1.3.0.0.zip",
    zipFileName: "evolvepos-backoffice-1.3.0.0.zip",
    zipFileSize: 12_580_912,
    createdAt: "2026-06-09T14:20:00.000Z",
    changes: [
      {
        id: createId(),
        versionId: versionA,
        category: "Feature",
        description:
          "Added a guided cash closing assistant with pre-check summary and discrepancy validation.",
      },
      {
        id: createId(),
        versionId: versionA,
        category: "Improvement",
        description:
          "Optimized memory usage while synchronizing large product catalogs.",
      },
      {
        id: createId(),
        versionId: versionA,
        category: "Security",
        description:
          "Strengthened local credential handling and blocked expired tokens.",
      },
    ],
  },
  {
    id: versionB,
    softwareId: softwareA,
    versionNumber: "1.2.4.0",
    summary:
      "Corrective delivery for pricing issues and the overnight update flow.",
    releaseChannel: "Testing",
    isCritical: false,
    releaseDate: "2026-06-04",
    zipFilePath: "/mock-storage/evolvepos-backoffice-1.2.4.0.zip",
    zipFileName: "evolvepos-backoffice-1.2.4.0.zip",
    zipFileSize: 12_104_410,
    createdAt: "2026-06-04T11:05:00.000Z",
    changes: [
      {
        id: createId(),
        versionId: versionB,
        category: "Bug Fix",
        description:
          "Fixed inconsistent rounding in price lists that combine multiple tax rules.",
      },
      {
        id: createId(),
        versionId: versionB,
        category: "Others",
        description:
          "Adjusted internal logging messages for faster support diagnostics.",
      },
    ],
  },
  {
    id: versionC,
    softwareId: softwareB,
    versionNumber: "0.9.1.0",
    summary:
      "Development build for testing the distribution channel and remote package controls.",
    releaseChannel: "Development",
    isCritical: false,
    releaseDate: "2026-06-01",
    zipFilePath: "/mock-storage/evolve-installer-0.9.1.0.zip",
    zipFileName: "evolve-installer-0.9.1.0.zip",
    zipFileSize: 7_812_148,
    createdAt: "2026-06-01T08:10:00.000Z",
    changes: [
      {
        id: createId(),
        versionId: versionC,
        category: "Feature",
        description:
          "Added release channel selection for Development, Testing, and Production remote checks.",
      },
      {
        id: createId(),
        versionId: versionC,
        category: "Deprecated",
        description:
          "Marked the legacy fixed-path direct download process as deprecated.",
      },
    ],
  },
]

export const initialUsers: UserAccount[] = [
  {
    id: adminUserId,
    userName: "admin",
    email: "admin@company.local",
    fullName: "Initial Administrator",
    role: "admin",
    isActive: true,
    createdAtUtc: "2026-06-11T19:15:56.237467Z",
  },
]
