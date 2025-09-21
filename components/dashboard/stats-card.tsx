import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  className?: string
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  className 
}: StatsCardProps) {
  return (
    <Card className={cn("bg-sidebar-accent text-sidebar-primary-foreground border-sidebar-border rounded-2xl shadow-xl", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn("text-sm font-bold text-slate-800", className)}>
          {title}
        </CardTitle>
        {Icon && <Icon className="h-5 w-5 text-sidebar-ring" />}
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-extrabold text-slate-800", className)}>{value}</div>
        {description && (
          <p className={cn("text-xs mt-1 text-slate-800", className)}>{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
            <span className="text-xs text-sidebar-accent-foreground ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}