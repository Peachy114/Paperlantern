// hooks/useAdminWithdrawals.ts
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid'

export interface WithdrawalRequest {
  id:             number
  amount_php:     number
  payout_method:  string
  payout_details: string
  status:         WithdrawalStatus
  admin_notes:    string | null
  processed_at:   string | null
  created_at:     string
  user:           { id: number; name: string; email: string }
}

export interface WithdrawalModal {
  open:       boolean
  withdrawal: WithdrawalRequest | null
  action:     'approved' | 'rejected' | 'paid' | null
  notes:      string
}

const EMPTY_MODAL: WithdrawalModal = {
  open:       false,
  withdrawal: null,
  action:     null,
  notes:      '',
}

export function useAdminWithdrawals() {
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | 'all'>('pending')
  const [page,         setPage]         = useState(1)
  const [processing,   setProcessing]   = useState<number | null>(null)
  const [modal,        setModal]        = useState<WithdrawalModal>(EMPTY_MODAL)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const { data } = await api.get<{
        data:         WithdrawalRequest[]
        current_page: number
        last_page:    number
        total:        number
      }>(`/admin/withdrawals?${params}`)
      return data
    },
    staleTime: 1000 * 30,
  })

  const openModal = (
    withdrawal: WithdrawalRequest,
    action: 'approved' | 'rejected' | 'paid'
  ) => {
    setModal({ open: true, withdrawal, action, notes: '' })
  }

  const closeModal = () => setModal(EMPTY_MODAL)

  const handleProcess = async () => {
    if (!modal.withdrawal || !modal.action) return
    setProcessing(modal.withdrawal.id)
    try {
      await api.put(`/admin/withdrawals/${modal.withdrawal.id}/process`, {
        status:      modal.action,
        admin_notes: modal.notes || null,
      })
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] })
      closeModal()
    } finally {
      setProcessing(null)
    }
  }

  const setFilterAndReset = (filter: WithdrawalStatus | 'all') => {
    setStatusFilter(filter)
    setPage(1)
  }

  return {
    withdrawals:  data?.data ?? [],
    lastPage:     data?.last_page ?? 1,
    total:        data?.total ?? 0,
    isLoading,
    page,
    setPage,
    statusFilter,
    setStatusFilter: setFilterAndReset,
    processing,
    modal,
    openModal,
    closeModal,
    setModalNotes: (notes: string) => setModal(m => ({ ...m, notes })),
    handleProcess,
  }
}