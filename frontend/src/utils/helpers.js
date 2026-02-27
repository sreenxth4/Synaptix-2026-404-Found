export function formatDate(date) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function timeAgo(date) {
  if (!date) return ''
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return `${seconds} seconds ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? 's' : ''} ago`
}

export function getPriorityColor(priority) {
  switch (priority?.toLowerCase()) {
    case 'low': return 'text-green-700 bg-green-100'
    case 'medium': return 'text-yellow-700 bg-yellow-100'
    case 'high': return 'text-orange-700 bg-orange-100'
    case 'critical': return 'text-red-700 bg-red-100'
    default: return 'text-gray-700 bg-gray-100'
  }
}

export function getSLAHours(priority) {
  switch (priority?.toLowerCase()) {
    case 'critical': return 4
    case 'high': return 24
    case 'medium': return 72
    case 'low': return 168
    default: return 72
  }
}

export function calculateTimeRemaining(deadline) {
  if (!deadline) return null
  const diff = new Date(deadline) - new Date()
  return diff / (1000 * 60 * 60) // hours
}
