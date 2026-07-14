import type { RentalApplication } from "@/types/doculoc";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getFlowStatus, type FlowStatusTone } from "./get-flow-status";

const flowStatusClasses: Record<FlowStatusTone, string> = {
  neutral: "border-stone-200 bg-stone-50 text-stone-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
};

type FlowStatusBadgeProps = {
  application: RentalApplication;
  showDescription?: boolean;
  className?: string;
};

export function FlowStatusBadge({
  application,
  showDescription = false,
  className,
}: FlowStatusBadgeProps) {
  const flowStatus = getFlowStatus(application);

  if (showDescription) {
    return (
      <div
        className={cn(
          "rounded-2xl border p-4",
          flowStatusClasses[flowStatus.tone],
          className,
        )}
      >
        <Badge
          variant="outline"
          className={cn(
            "h-7 rounded-full px-3",
            flowStatusClasses[flowStatus.tone],
          )}
        >
          {flowStatus.label}
        </Badge>

        <p className="mt-3 text-sm leading-relaxed">
          {flowStatus.description}
        </p>
      </div>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-7 rounded-full px-3",
        flowStatusClasses[flowStatus.tone],
        className,
      )}
    >
      {flowStatus.label}
    </Badge>
  );
}

export function FlowStatusSummary({
  application,
}: {
  application: RentalApplication;
}) {
  return (
    <div className="min-w-44">
      <FlowStatusBadge application={application} />
    </div>
  );
}