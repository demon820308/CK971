"use client"

import useSWRInfinite from "swr/infinite"
import { toast } from "@/lib/toast"
import type { Event, PaginatedResponse } from "@/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useEvents() {
  const {
    data,
    error,
    size,
    setSize,
    isValidating,
    mutate,
  } = useSWRInfinite<PaginatedResponse<Event>>(
    (index, previousPageData) => {
      if (previousPageData && !previousPageData.hasMore) return null
      if (index === 0) return "/api/events?limit=10"
      return `/api/events?cursor=${previousPageData.nextCursor}&limit=10`
    },
    fetcher,
    { revalidateFirstPage: false }
  )

  const events = data ? data.flatMap((page) => page.items) : []
  const isLoadingMore = isValidating && data && typeof data[size - 1] === "undefined"
  const isEmpty = data?.[0]?.items.length === 0
  const isReachingEnd = isEmpty || (data && !data[data.length - 1]?.hasMore)

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
