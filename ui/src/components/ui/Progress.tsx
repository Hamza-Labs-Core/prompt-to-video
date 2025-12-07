import React from "react";
import { cn } from "../../lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
  variant?: "default" | "success" | "warning" | "error";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, showLabel = false, variant = "default", ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const variantStyles = {
      default: "bg-blue-600",
      success: "bg-green-600",
      warning: "bg-yellow-600",
      error: "bg-red-600",
    };

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-800">
          <div
            className={cn(
              "h-full transition-all duration-300 ease-in-out",
              variantStyles[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <p className="mt-1 text-xs text-gray-400 text-right">
            {Math.round(percentage)}%
          </p>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";

export default Progress;
