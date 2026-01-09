import { cn } from "../utils/css";

interface SegmentedControlProps {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center bg-[#161726] rounded-[46px]",
        className
      )}
    >
      {options.map(option => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "px-3 py-1.5 rounded-[46px] text-sm font-medium leading-[120%] border-[1px] transition-colors duration-200",
              isActive
                ? "text-white/80 border-[#9C75FF] hover:text-white hover:border-[#B894FF]"
                : "text-white/50 border-transparent hover:text-white/70 hover:border-[#9C75FF]/30 hover:bg-white/1"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
