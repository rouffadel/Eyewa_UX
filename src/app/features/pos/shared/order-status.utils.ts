export type OrderStatusCategory = 'all' | 'completed' | 'pending' | 'incomplete';

/**
 * Categorizes an order's status string into standard status categories:
 * - 'completed': complete, delivered, paid
 * - 'incomplete': incomplete, cancel, return
 * - 'pending': pending, open, in progress, or default
 */
export function categorizeOrderStatus(statusName?: string | null): 'completed' | 'pending' | 'incomplete' {
  const st = (statusName || '').trim().toLowerCase();
  
  if (st.includes('complete') || st.includes('delivered') || st.includes('paid')) {
    return 'completed';
  }
  
  if (st.includes('incomplete') || st.includes('cancel') || st.includes('return')) {
    return 'incomplete';
  }
  
  return 'pending';
}
