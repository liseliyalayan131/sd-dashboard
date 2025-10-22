import { create } from 'zustand'

interface RefreshStore {
  shouldRefreshCustomers: boolean
  shouldRefreshProducts: boolean
  triggerCustomersRefresh: () => void
  triggerProductsRefresh: () => void
  resetCustomersRefresh: () => void
  resetProductsRefresh: () => void
}

export const useRefreshStore = create<RefreshStore>((set) => ({
  shouldRefreshCustomers: false,
  shouldRefreshProducts: false,
  triggerCustomersRefresh: () => set({ shouldRefreshCustomers: true }),
  triggerProductsRefresh: () => set({ shouldRefreshProducts: true }),
  resetCustomersRefresh: () => set({ shouldRefreshCustomers: false }),
  resetProductsRefresh: () => set({ shouldRefreshProducts: false }),
}))
