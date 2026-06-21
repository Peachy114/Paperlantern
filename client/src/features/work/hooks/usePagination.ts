import { useState } from 'react'

export const PAGE_SIZE = 10

export function usePagination<T>(items: T[]) {
    const [page, setPage] = useState(1)
    const totalPages = Math.ceil(items.length / PAGE_SIZE)
    const paginated = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    return { paginated, page, setPage, totalPages }
}
