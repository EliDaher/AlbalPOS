import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  onClick?: any
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  onClick,
}: StatsCardProps) {
  return (
    <Card onClick={onClick} className={cn("stat-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center font-medium",
                  trend.isPositive ? "text-accent-600" : "text-destructive",
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}
              </span>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
