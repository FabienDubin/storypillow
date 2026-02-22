interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export default function StepIndicator({
  currentStep,
  totalSteps,
  labels,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-sans font-bold shrink-0 ${
                isActive
                  ? "bg-gold text-navy"
                  : isCompleted
                    ? "bg-gold/30 text-gold"
                    : "bg-purple/20 text-cream/40"
              }`}
            >
              {isCompleted ? "✓" : step}
            </div>
            <span
              className={`text-xs font-sans hidden sm:block ${
                isActive
                  ? "text-gold font-semibold"
                  : isCompleted
                    ? "text-cream/60"
                    : "text-cream/30"
              }`}
            >
              {labels[i]}
            </span>
            {step < totalSteps && (
              <div
                className={`flex-1 h-px ${
                  isCompleted ? "bg-gold/30" : "bg-purple/20"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
