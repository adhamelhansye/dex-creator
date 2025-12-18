import clsx from "clsx";

interface ProfileTypeCardProps {
  title: string;
  description: string;
  footer?: string;
  isSelected: boolean;
  onClick: () => void;
}

export function ProfileTypeCard({
  title,
  description,
  footer,
  isSelected,
  onClick,
}: ProfileTypeCardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-background-light/30 border min-h-[160px] rounded-[20px] w-full cursor-pointer transition-all",
        isSelected ? "border-primary-light" : "border-[rgba(255,255,255,0.06)]"
      )}
    >
      <div className="flex flex-col gap-5 items-start justify-center min-h-inherit p-6 md:p-8">
        <div className="flex flex-col gap-5">
          <p className="font-semibold leading-[1.2] text-xl md:text-2xl text-base-contrast">
            {title}
          </p>
          <p className="leading-[1.5] text-sm md:text-sm text-base-contrast-54">
            {description}
          </p>
        </div>
        {footer && (
          <p className="leading-[1.2] text-[10px] text-base-contrast-36">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}
