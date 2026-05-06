"use client"

import useSWRInfinite from "swr/infinite"
import { toast } from "@/lib/toast"
import type { Message, PaginatedResponse } from "@/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface UseMessagesOptions {
  limit?: number
  topLiked?: number
  maxPages?: number
}

export function useMessages(options: UseMessagesOptions = {}) {
  const { limit = 30, topLiked = 0, maxPages } = options
  const {
    data,
    error,
    size,
    setSize,
    isValidating,
    mutate,
  } = useSWRInfinite<PaginatedResponse<Message>>(
    (index, previousPageData) => {
      if (maxPages && index >= maxPages) return null
      if (previousPageData && !previousPageData.hasMore) return null
      const topLikedParam = topLiked > 0 && index === 0 ? `&topLiked=${topLiked}` : ""
      if (index === 0) return `/api/messages?limit=${limit}${topLikedParam}`
      return `/api/messages?cursor=${previousPageData.nextCursor}&limit=${limit}`
    },
    fetcher,
    { revalidateFirstPage: false }
  )

  const messages = data ? data.flatMap((page) => page.items) : []
  const isLoadingMore = isValidating && data && typeof data[size - 1] === "undefined"
  const isEmpty = data?.[0]?.items.length === 0
  const isReachingEnd =
    isEmpty ||
    (maxPages ? size >= maxPages : false) ||
    (data && !data[data.length - 1]?.hasMore)

  const revalidate = () => mutate()

  const toggleLike = async (messageId: string) => {
    const res = await fetch(`/api/messages/${messageId}/like`, { method: "POST" })
    if (res.status === 401) {
      toast.error("请先登录")
      throw new Error("unauthorized")
    }
    revalidate()
  }

  const addReply = async (messageId: string, content: string) => {
    const res = await fetch(`/api/messages/${messageId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
    if (res.status === 401) {
      toast.error("请先登录")
      throw new Error("unauthorized")
    }
    revalidate()
  }

  const loadMore = () => setSize(size + 1)

  return {
    messages,
    error,
    size,
    setSize,
    isLoadingMore,
    isReachingEnd,
    loadMore,
    mutate: revalidate,
    toggleLike,
    addReply,
  }
}
