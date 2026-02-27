import React, { useState, useEffect } from 'react'
import { calculateTimeRemaining } from '../utils/helpers.js'

export default function SLATimer({ sla_deadline }) {
  const [hoursLeft, setHoursLeft] = useState(calculateTimeRemaining(sla_deadline))

  useEffect(() => {
    if (!sla_deadline) return
    const interval = setInterval(() => {
      setHoursLeft(calculateTimeRemaining(sla_deadline))
    }, 60000)
    return () => clearInterval(interval)
  }, [sla_deadline])

  if (!sla_deadline || hoursLeft === null) return null

  const isUrgent = hoursLeft < 2
  const isOverdue = hoursLeft < 0
  const hours = Math.floor(Math.abs(hoursLeft))
  const minutes = Math.floor((Math.abs(hoursLeft) % 1) * 60)

  if (isOverdue) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full animate-pulse">
      ⏰ OVERDUE
    </span>
  )

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
      isUrgent ? 'text-red-700 bg-red-100 animate-pulse' : 'text-orange-700 bg-orange-100'
    }`}>
      ⏱️ {hours}h {minutes}m left
    </span>
  )
}
