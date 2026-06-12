import { create } from "zustand"
import { persist } from "zustand/middleware"

import {
  initialReleaseVersions,
  initialSoftwareProducts,
  initialUsers,
} from "@/data/mock-data"
import type {
  CreateSoftwareInput,
  CreateVersionInput,
  ReleaseVersion,
  Session,
  SoftwareProduct,
  UserAccount,
} from "@/types/domain"
import {
  buildZipPath,
  generateSoftwareCode,
  isValidSemVer,
  sortVersionsByReleaseDate,
} from "@/utils/version-utils"

type AppState = {
  isMockMode: boolean
  session: Session | null
  softwareProducts: SoftwareProduct[]
  releaseVersions: ReleaseVersion[]
  users: UserAccount[]
  login: (email: string, password: string) => void
  logout: () => void
  addSoftware: (input: CreateSoftwareInput) => SoftwareProduct
  createVersion: (draft: CreateVersionInput) => string
  createUser: (input: Omit<UserAccount, "id" | "createdAtUtc">) => UserAccount
  updateUser: (
    userId: string,
    input: Omit<UserAccount, "id" | "createdAtUtc">
  ) => UserAccount
  deleteUser: (userId: string) => void
  resetDemoData: () => void
}

const initialState = {
  isMockMode: true,
  session: null,
  softwareProducts: initialSoftwareProducts,
  releaseVersions: initialReleaseVersions,
  users: initialUsers,
}

function createId() {
  return crypto.randomUUID()
}

function ensureNonEmpty(value: string, fieldName: string) {
  if (value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`)
  }
}

function ensureUniqueUserFields(
  users: UserAccount[],
  email: string,
  userName: string,
  ignoreUserId?: string
) {
  if (
    users.some(
      (user) =>
        user.id !== ignoreUserId &&
        user.email.trim().toLowerCase() === email.trim().toLowerCase()
    )
  ) {
    throw new Error("A user with this email already exists.")
  }

  if (
    users.some(
      (user) =>
        user.id !== ignoreUserId &&
        user.userName.trim().toLowerCase() === userName.trim().toLowerCase()
    )
  ) {
    throw new Error("A user with this username already exists.")
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      login: (email, password) => {
        const normalizedEmail = email.trim().toLowerCase()

        if (!normalizedEmail.includes("@")) {
          throw new Error("Enter a valid email address.")
        }

        if (password.trim().length < 6) {
          throw new Error("Password must have at least 6 characters.")
        }

        set({
          session: {
            token: `mock-${createId()}`,
            expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
            user: {
              id: createId(),
              name: "Evolve Administrator",
              email: normalizedEmail,
            },
          },
        })
      },
      logout: () => {
        set({ session: null })
      },
      addSoftware: ({ name, description }) => {
        ensureNonEmpty(name, "Name")
        ensureNonEmpty(description, "Description")

        const existingCodes = get().softwareProducts.map(
          (software) => software.code
        )
        const software: SoftwareProduct = {
          id: createId(),
          name: name.trim(),
          description: description.trim(),
          code: generateSoftwareCode(name, existingCodes),
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          softwareProducts: [software, ...state.softwareProducts],
        }))

        return software
      },
      createVersion: (draft) => {
        ensureNonEmpty(draft.softwareId, "Software")
        ensureNonEmpty(draft.versionNumber, "Version number")
        ensureNonEmpty(draft.summary, "Summary")

        if (!isValidSemVer(draft.versionNumber)) {
          throw new Error("Version number must use the X.Y.Z.W format.")
        }

        if (draft.zipFileName.trim().length === 0 || draft.zipFileSize <= 0) {
          throw new Error("You must attach a .zip file.")
        }

        const software = get().softwareProducts.find(
          (item) => item.id === draft.softwareId
        )

        if (!software) {
          throw new Error("The selected software does not exist.")
        }

        const changes = draft.changes
          .filter((change) => change.description.trim().length > 0)
          .map((change) => ({
            id: createId(),
            versionId: "",
            category: change.category,
            description: change.description.trim(),
          }))

        if (changes.length === 0) {
          throw new Error("Add at least one technical change.")
        }

        const versionId = createId()
        const version: ReleaseVersion = {
          id: versionId,
          softwareId: draft.softwareId,
          versionNumber: draft.versionNumber.trim(),
          summary: draft.summary.trim(),
          releaseChannel: draft.releaseChannel,
          isCritical: draft.isCritical,
          releaseDate: draft.releaseDate,
          zipFilePath: buildZipPath(software.code, draft.versionNumber.trim()),
          zipFileName: draft.zipFileName,
          zipFileSize: draft.zipFileSize,
          createdAt: new Date().toISOString(),
          changes: changes.map((change) => ({
            ...change,
            versionId,
          })),
        }

        set((state) => ({
          releaseVersions: sortVersionsByReleaseDate([
            version,
            ...state.releaseVersions,
          ]),
        }))

        return versionId
      },
      createUser: (input) => {
        ensureNonEmpty(input.userName, "Username")
        ensureNonEmpty(input.fullName, "Full name")
        ensureNonEmpty(input.email, "Email")

        const normalizedEmail = input.email.trim().toLowerCase()
        const normalizedUserName = input.userName.trim().toLowerCase()
        const existingUsers = get().users

        ensureUniqueUserFields(
          existingUsers,
          normalizedEmail,
          normalizedUserName
        )

        const user: UserAccount = {
          id: createId(),
          userName: input.userName.trim(),
          email: normalizedEmail,
          fullName: input.fullName.trim(),
          role: input.role,
          isActive: input.isActive,
          createdAtUtc: new Date().toISOString(),
        }

        set((state) => ({
          users: [user, ...state.users],
        }))

        return user
      },
      updateUser: (userId, input) => {
        ensureNonEmpty(input.userName, "Username")
        ensureNonEmpty(input.fullName, "Full name")
        ensureNonEmpty(input.email, "Email")

        const currentUsers = get().users
        const existingUser = currentUsers.find((user) => user.id === userId)
        if (!existingUser) {
          throw new Error("The selected user does not exist.")
        }

        const normalizedEmail = input.email.trim().toLowerCase()
        const normalizedUserName = input.userName.trim().toLowerCase()

        ensureUniqueUserFields(
          currentUsers,
          normalizedEmail,
          normalizedUserName,
          userId
        )

        if (existingUser.role === "admin" && input.role !== "admin") {
          const adminCount = currentUsers.filter((user) => user.role === "admin")
            .length
          if (adminCount <= 1) {
            throw new Error("You cannot remove the admin role from the last admin user.")
          }
        }

        const updatedUser: UserAccount = {
          ...existingUser,
          userName: input.userName.trim(),
          email: normalizedEmail,
          fullName: input.fullName.trim(),
          role: input.role,
          isActive: input.isActive,
        }

        set((state) => ({
          users: state.users.map((user) => (user.id === userId ? updatedUser : user)),
        }))

        return updatedUser
      },
      deleteUser: (userId) => {
        const target = get().users.find((user) => user.id === userId)
        if (!target) {
          return
        }

        const currentEmail = get().session?.user.email.trim().toLowerCase()
        if (currentEmail && target.email.trim().toLowerCase() === currentEmail) {
          throw new Error("You cannot delete the currently logged-in user.")
        }

        if (target.role === "admin") {
          const adminCount = get().users.filter((user) => user.role === "admin")
            .length
          if (adminCount <= 1) {
            throw new Error("You cannot delete the last admin user.")
          }
        }

        set((state) => ({
          users: state.users.filter((user) => user.id !== userId),
        }))
      },
      resetDemoData: () => {
        set(initialState)
      },
    }),
    {
      name: "evolve-version-manager",
      partialize: (state) => ({
        isMockMode: state.isMockMode,
        session: state.session,
        softwareProducts: state.softwareProducts,
        releaseVersions: state.releaseVersions,
        users: state.users,
      }),
    }
  )
)
