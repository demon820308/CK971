"use client"

import useSWRInfinite from "swr/infinite"
import { toast } from "@/lib/toast"
import type { Event, PaginatedResponse } from "@/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface UseEventsOptions {
  limit?: number
  maxPages?: number
}

export function useEvents(options: UseEventsOptions = {}) {
  const { limit = 10, maxPages } = options
  const {
    data,
    error,
    size,
    setSize,
    isValidating,
    mutate,
  } = useSWRInfinite<PaginatedResponse<Event>>(
    (index, previousPageData) => {
      if (maxPages && index >= maxPages) return null
      if (previousPageData && !previousPageData.hasMore) return null
      if (index === 0) return `/api/events?limit=${limit}`
      return `/api/events?cursor=${previousPageData.nextCursor}&limit=${limit}`
    },
    fetcher,
    { revalidateFirstPage: false }
  )

  const events = data ? data.flatMap((page) => page.items) : []
  const isLoadingMore = isValidating && data && typeof data[size - 1] === "undefined"
  const isEmpty = data?.[0]?.items.length === 0
  const isReachingEnd =
    isEmpty ||
    (maxPages ? size >= maxPages : false) ||
    (data && !data[data.length - 1]?.hasMore)

  const revalidate = () => mutate()

  const toggleRsvp = async (eventId: string) => {
    const res = await fetch(`/api/events/${eventId}/rsvp`, { method: "POST" })
    if (res.status === 401) {
      toast.error("请先登录")
      throw new Error("unauthorized")
    }
    revalidate()
  }

  const loadMore = () => setSize(size + 1)

  return {
    events,
    error,
    size,
    setSize,
    isLoadingMore,
    isReachingEnd,
    loadMore,
    mutate: revalidate,
    toggleRsvp,
  }
}
