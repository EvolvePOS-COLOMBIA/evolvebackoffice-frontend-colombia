import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"

import { queryClient } from "@/config/react-query"
import {
  createVersion,
  deleteVersion,
  downloadVersion,
  getAllVersions,
  getVersionsBySoftware,
  updateVersion,
  type CreateVersionRequest,
  type UpdateVersionRequest,
} from "@/features/versions/services/version.service"
import { useNotify } from "@/hooks/use-notify"

export function useVersions(softwareId: string) {
  return useQuery({
    queryKey: ["versions", softwareId],
    queryFn: () => getVersionsBySoftware(softwareId),
    enabled: softwareId.length > 0,
  })
}

export function useAllVersions() {
  return useQuery({
    queryKey: ["versions", "all"],
    queryFn: getAllVersions,
  })
}

export function useCreateVersion(softwareId: string) {
  const notify = useNotify()

  return useMutation({
    mutationFn: (payload: { data: CreateVersionRequest; zipFile: File }) =>
      createVersion(softwareId, payload.data, payload.zipFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["versions", softwareId] })
      queryClient.invalidateQueries({ queryKey: ["versions", "all"] })
      notify.success("Release version created successfully.")
    },
    onError: (error) => {
      notify.error(error instanceof Error ? error.message : "Release version creation failed: unknown error.")
    },
  })
}

export function useUpdateVersion() {
  const notify = useNotify()

  return useMutation({
    mutationFn: (payload: { versionId: string; data: UpdateVersionRequest }) =>
      updateVersion(payload.versionId, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["versions", "all"] })
      queryClient.invalidateQueries({ queryKey: ["versions"] })
      notify.success("Release version updated successfully.")
    },
    onError: (error) => {
      notify.error(error instanceof Error ? error.message : "Release version update failed: unknown error.")
    },
  })
}

export function useDeleteVersion() {
  const notify = useNotify()

  return useMutation({
    mutationFn: (versionId: string) => deleteVersion(versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["versions", "all"] })
      queryClient.invalidateQueries({ queryKey: ["versions"] })
      notify.success("Release version deleted successfully.")
    },
    onError: (error) => {
      notify.error(error instanceof Error ? error.message : "Release version deletion failed: unknown error.")
    },
  })
}

export function useDownloadVersion() {
  return useMutation({
    mutationFn: (versionId: string) => downloadVersion(versionId),
  })
}

type DownloadVersionParams = {
  versionId: string
  fileName: string
}

export function useVersionPackageDownload() {
  const notify = useNotify()
  const { mutateAsync: triggerDownload } = useDownloadVersion()
  const [downloadingVersionId, setDownloadingVersionId] = useState<string | null>(null)

  const handleDownloadVersion = async ({ versionId, fileName }: DownloadVersionParams) => {
    setDownloadingVersionId(versionId)

    try {
      await notify.promise(
        triggerDownload(versionId).then((blob) => {
          const url = URL.createObjectURL(blob)
          const anchor = document.createElement("a")

          anchor.href = url
          anchor.download = fileName
          document.body.appendChild(anchor)
          anchor.click()
          anchor.remove()
          URL.revokeObjectURL(url)

          return fileName
        }),
        {
          loading: "Downloading release package...",
          success: (downloadedFileName) => `${downloadedFileName} downloaded successfully.`,
          error: (error) => (error instanceof Error ? error.message : "The release package could not be downloaded."),
        }
      )
    } finally {
      setDownloadingVersionId(null)
    }
  }

  return {
    downloadingVersionId,
    isDownloadingVersion: (versionId: string) => downloadingVersionId === versionId,
    handleDownloadVersion,
  }
}
