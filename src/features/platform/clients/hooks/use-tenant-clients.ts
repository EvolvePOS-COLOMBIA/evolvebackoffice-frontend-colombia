import { useCallback } from "react"

import type { TenantClient, TenantClientFormValues } from "@/features/platform/clients/types"
import { useAppStore } from "@/store/app-store"

export function useTenantClients() {
  const clients = useAppStore((state) => state.platformClients)
  const savePlatformClient = useAppStore((state) => state.savePlatformClient)
  const deletePlatformClient = useAppStore((state) => state.deletePlatformClient)

  const createClient = useCallback(
    (values: TenantClientFormValues) => {
      validateSlugUniqueness(clients, values.slug)

      const client: TenantClient = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...values,
      }

      savePlatformClient(client)
      return client
    },
    [clients, savePlatformClient]
  )

  const updateClient = useCallback(
    (clientId: string, values: TenantClientFormValues) => {
      const currentClient = clients.find((client) => client.id === clientId)

      if (!currentClient) {
        throw new Error("The selected client could not be found.")
      }

      validateSlugUniqueness(clients, values.slug, clientId)

      savePlatformClient({
        ...currentClient,
        ...values,
      })
    },
    [clients, savePlatformClient]
  )

  const removeClient = useCallback(
    (clientId: string) => {
      deletePlatformClient(clientId)
    },
    [deletePlatformClient]
  )

  return {
    clients,
    createClient,
    updateClient,
    removeClient,
  }
}

function validateSlugUniqueness(clients: TenantClient[], slug: string, currentClientId?: string) {
  const normalizedSlug = slug.trim().toLowerCase()
  const duplicatedClient = clients.find(
    (client) => client.slug.toLowerCase() === normalizedSlug && client.id !== currentClientId
  )

  if (duplicatedClient) {
    throw new Error("The slug is already assigned to another client.")
  }
}
