const full = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })

/** ₦18,500 */
export const formatNaira = (amount: number) => full.format(Math.round(amount)).replace('NGN', '₦').replace(/\s/g, '')
