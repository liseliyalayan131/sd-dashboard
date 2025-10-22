import { useState, useEffect, useRef, useCallback } from 'react'

interface UseInfiniteScrollOptions {
  itemsPerPage?: number
  threshold?: number
}

export function useInfiniteScroll<T>(
  allItems: T[],
  options: UseInfiniteScrollOptions = {}
) {
  const { itemsPerPage = 50, threshold = 100 } = options
  
  const [displayedItems, setDisplayedItems] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)
  const allItemsRef = useRef<T[]>(allItems)
  const prevSignature = useRef<string>('')

  useEffect(() => {
    const signature = `${allItems.length}-${JSON.stringify(allItems[0])}`
    
    if (signature !== prevSignature.current) {
      allItemsRef.current = allItems
      setPage(1)
      setDisplayedItems(allItems.slice(0, itemsPerPage))
      setHasMore(allItems.length > itemsPerPage)
      prevSignature.current = signature
    }
  }, [allItems, itemsPerPage])

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    
    setTimeout(() => {
      const currentItems = allItemsRef.current
      const nextPage = page + 1
      const startIndex = page * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const newItems = currentItems.slice(startIndex, endIndex)
      
      if (newItems.length > 0) {
        setDisplayedItems(prev => [...prev, ...newItems])
        setPage(nextPage)
        setHasMore(endIndex < currentItems.length)
      } else {
        setHasMore(false)
      }
      
      setIsLoading(false)
    }, 300)
  }, [page, itemsPerPage, isLoading, hasMore])

  useEffect(() => {
    const target = observerTarget.current
    if (!target) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(target)

    return () => {
      if (target) {
        observer.unobserve(target)
      }
    }
  }, [loadMore, hasMore, isLoading])

  const reset = useCallback(() => {
    const currentItems = allItemsRef.current
    setPage(1)
    setDisplayedItems(currentItems.slice(0, itemsPerPage))
    setHasMore(currentItems.length > itemsPerPage)
  }, [itemsPerPage])

  return {
    displayedItems,
    hasMore,
    isLoading,
    observerTarget,
    reset,
    totalItems: allItems.length,
    displayedCount: displayedItems.length
  }
}
