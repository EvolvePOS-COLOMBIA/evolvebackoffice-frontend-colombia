import {
  CHANGE_CATEGORIES,
  CHANGE_CATEGORY_LABELS,
  type ChangeCategory,
  type ReleaseVersion,
  type SoftwareProduct,
  type VersionChange,
} from "@/types/domain"

const semVerPattern = /^\d+\.\d+\.\d+\.\d+$/

function slugifyToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
}

export function isValidSemVer(value: string) {
  return semVerPattern.test(value.trim())
}

export function generateSoftwareCode(name: string, existingCodes: string[]) {
  const baseToken = slugifyToken(name).replace(/-/g, "")
  const baseCode = `SW-${baseToken || "SOFTWARE"}`

  if (!existingCodes.includes(baseCode)) {
    return baseCode
  }

  let counter = 2
  while (existingCodes.includes(`${baseCode}-${counter}`)) {
    counter += 1
  }

  return `${baseCode}-${counter}`
}

export function sortVersionsByReleaseDate(versions: ReleaseVersion[]) {
  return [...versions].sort((left, right) =>
    right.releaseDate.localeCompare(left.releaseDate)
  )
}

export function groupChangesByCategory(changes: VersionChange[]) {
  return CHANGE_CATEGORIES.reduce<
    Array<{
      type: ChangeCategory
      label: string
      items: VersionChange[]
    }>
  >((groups, changeCategory) => {
    const items = changes.filter((change) => change.category === changeCategory)

    if (items.length > 0) {
      groups.push({
        type: changeCategory,
        label: CHANGE_CATEGORY_LABELS[changeCategory],
        items,
      })
    }

    return groups
  }, [])
}

export function getSoftwareById(
  softwareProducts: SoftwareProduct[],
  softwareId: string
) {
  return softwareProducts.find((software) => software.id === softwareId)
}

export function buildZipPath(softwareCode: string, versionNumber: string) {
  return `/mock-storage/${softwareCode.toLowerCase()}-${versionNumber}.zip`
}

export function downloadMockPackage(
  version: ReleaseVersion,
  software?: SoftwareProduct
) {
  const manifest = [
    `Software: ${software?.name ?? "Unknown"}`,
    `Code: ${software?.code ?? "N/A"}`,
    `Version: ${version.versionNumber}`,
    `Channel: ${version.releaseChannel}`,
    `Critical: ${version.isCritical ? "Yes" : "No"}`,
    `Release Date: ${version.releaseDate}`,
    "",
    version.summary,
    "",
    "Changes:",
    ...version.changes.map(
      (change, index) =>
        `${index + 1}. [${change.category}] ${change.description}`
    ),
  ].join("\n")

  const blob = new Blob([manifest], { type: "application/zip" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = version.zipFileName
  anchor.click()
  URL.revokeObjectURL(url)
}
