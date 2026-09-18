'use client'

import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change: number
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red'
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    changePositive: 'text-blue-600',
    changeNegative: 'text-red-600',
  },
  green: {
    bg: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    changePositive: 'text-green-600',
    changeNegative: 'text-red-600',
  },
  purple: {
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    changePositive: 'text-green-600',
    changeNegative: 'text-red-600',
  },
  yellow: {
    bg: 'bg-yellow-50',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    changePositive: 'text-green-600',
    changeNegative: 'text-red-600',
  },
  red: {
    bg: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    changePositive: 'text-green-600',
    changeNegative: 'text-red-600',
  },
}

export default function StatsCard({ title, value, change, icon: Icon, color }: StatsCardProps) {
  const classes = colorClasses[color]
  const isPositive = change >= 0

  return (
    <div className={`${classes.bg} rounded-lg p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`${classes.iconBg} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${classes.iconColor}`} />
        </div>
        <div className={`text-sm font-medium ${isPositive ? classes.changePositive : classes.changeNegative}`}>
          {isPositive ? '+' : ''}{change}%
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{title}</div>
    </div>
  )
}