
// Note: Import these from a proper utils file
const formatCurrencyLocal = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

const formatDateLocal = (date: string | Date) =>
  new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

const formatTimeLocal = (date: string | Date) =>
  new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

export { formatCurrencyLocal as formatCurrency, formatDateLocal as formatDate, formatTimeLocal as formatTime }