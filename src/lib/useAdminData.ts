import { useOutletContext } from 'react-router-dom'
import type { useData } from './useData'

/** Data shared by AdminLayout with every admin page. */
export const useAdminData = () => useOutletContext<ReturnType<typeof useData>>()
