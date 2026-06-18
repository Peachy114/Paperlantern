import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { announcementApi, type Announcement, type AnnouncementPayload } from '@/api/announcement'

export function useAdminAnnouncements() {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: () => announcementApi.getAll().then(r => r.data as Announcement[]),
  })

  const createMutation = useMutation({
    mutationFn: (payload: AnnouncementPayload) => announcementApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      setError(null)
    },
    onError: (err: any) => {
      const errors = err.response?.data?.errors
      if (errors) {
        const first = Object.values(errors)[0] as string[]
        setError(first[0])
      } else {
        setError(err.response?.data?.message ?? 'Failed to create announcement.')
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<AnnouncementPayload> }) =>
      announcementApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      setError(null)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message ?? 'Failed to update announcement.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => announcementApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
    },
    onError: (err: any) => {
      setError(err.response?.data?.message ?? 'Failed to delete announcement.')
    },
  })

  return {
    announcements: data ?? [],
    isLoading,
    error,
    setError,
    create:  (payload: AnnouncementPayload) => createMutation.mutateAsync(payload),
    update:  (id: number, payload: Partial<AnnouncementPayload>) => updateMutation.mutateAsync({ id, payload }),
    remove:  (id: number) => deleteMutation.mutateAsync(id),
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    deleting: deleteMutation.isPending,
  }
}