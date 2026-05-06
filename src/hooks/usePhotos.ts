"use client"

import useSWRInfinite from "swr/infinite"
import { toast } from "@/lib/toast"
import type { Photo, PaginatedResponse } from "@/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface UsePhotosOptions {
  limit?: number
  topLiked?: number
  maxPages?: number
}

export function usePhotos(options: UsePhotosOptions = {}) {
  const { limit = 20, topLiked = 0, maxPages } = options
  const {
    data,
    error,
    size,
    setSize,
    isValidating,
    mutate,
  } = useSWRInfinite<PaginatedResponse<Photo>>(
    (index, previousPageData) => {
      if (maxPages && index >= maxPages) return null
      if (previousPageData && !previousPageData.hasMore) return null
      const topLikedParam = topLiked > 0 && index === 0 ? `&topLiked=${topLiked}` : ""
      if (index === 0) return `/api/photos?limit=${limit}${topLikedParam}`
      return `/api/photos?cursor=${previousPageData.nextCursor}&limit=${limit}`
    },
    fetcher,
    { revalidateFirstPage: false }
  )

  const photos = data ? data.flatMap((page) => page.items) : []
  const isLoadingMore = isValidating && data && typeof data[size - 1] === "undefined"
  const isEmpty = data?.[0]?.items.length === 0
  const isReachingEnd =
    isEmpty ||
    (maxPages ? size >= maxPages : false) ||
    (data && !data[data.length - 1]?.hasMore)

  const revalidate = () => mutate()

  const toggleLike = async (photoId: string) => {
    const res = await fetch(`/api/photos/${photoId}/like`, { method: "POST" })
    if (res.status === 401) {
      toast.error("请先登录")
      throw new Error("unauthorized")
    }
    revalidate()
  }

  const addComment = async (photoId: string, content: string, parentId?: string) => {
    const res = await fetch(`/api/photos/${photoId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentId }),
    })
    if (res.status === 401) {
      toast.error("请先登录")
      throw new Error("unauthorized")
    }
    revalidate()
  }

  return {
    photos,
    error,
    size,
    setSize,
    isLoadingMore,
    isReachingEnd,
    mutate: revalidate,
    toggleLike,
    addComment,
  }
}
