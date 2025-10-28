import { create } from 'zustand'

interface RefreshStore {
  shouldRefreshCustomers: boolean
  shouldRefreshProducts: boolean
  shouldRefreshServices: boolean
  shouldRefreshTransactions: boolean
  shouldRefreshReports: boolean
  triggerCustomersRefresh: () => void
  triggerProductsRefresh: () => void
  triggerServicesRefresh: () => void
  triggerTransactionsRefresh: () => void
  triggerReportsRefresh: () => void
  resetCustomersRefresh: () => void
  resetProductsRefresh: () => void
  resetServicesRefresh: () => void
  resetTransactionsRefresh: () => void
  resetReportsRefresh: () => void
}

export const useRefreshStore = create<RefreshStore>((set) => ({
  shouldRefreshCustomers: false,
  shouldRefreshProducts: false,
  shouldRefreshServices: false,
  shouldRefreshTransactions: false,
  shouldRefreshReports: false,
  triggerCustomersRefresh: () => set({ shouldRefreshCustomers: true }),
  triggerProductsRefresh: () => set({ shouldRefreshProducts: true }),
  triggerServicesRefresh: () => set({ shouldRefreshServices: true }),
  triggerTransactionsRefresh: () => set({ shouldRefreshTransactions: true }),
  triggerReportsRefresh: () => set({ shouldRefreshReports: true }),
  resetCustomersRefresh: () => set({ shouldRefreshCustomers: false }),
  resetProductsRefresh: () => set({ shouldRefreshProducts: false }),
  resetServicesRefresh: () => set({ shouldRefreshServices: false }),
  resetTransactionsRefresh: () => set({ shouldRefreshTransactions: false }),
  resetReportsRefresh: () => set({ shouldRefreshReports: false }),
}))
