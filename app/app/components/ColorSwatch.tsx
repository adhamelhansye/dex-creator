import React from "react";

interface ColorSwatchProps {
  name: string;
  displayName: string;
  storedValue: string | null;
  isValid: boolean;
  commaRgb: string;
  textColor: string;
  needsShadow: boolean;
  selectedColors: string[];
  onSelectionChange?: (selectedColors: string[]) => void;
  handleCheckboxChange: (colorName: string, checked: boolean) => void;
  handleSwatchClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function ColorSwatch({
  name,
  displayName,
  storedValue,
  isValid,
  commaRgb,
  textColor,
  needsShadow,
  selectedColors,
  onSelectionChange,
  handleCheckboxChange,
  handleSwatchClick,
}: ColorSwatchProps) {
  return (
    <div key={name} className="relative flex-[0_1_200px]">
      <div
        className={`h-16 w-full rounded-md flex items-center justify-between px-3 py-2 border ${!isValid ? "border-error/50" : "border-light/10"} cursor-pointer hover:ring-2 hover:ring-primary transition-all ${selectedColors.includes(name) ? "ring-2 ring-primary/50" : ""}`}
        style={{
          backgroundColor: isValid ? `rgb(${commaRgb})` : "rgba(255,0,0,0.15)",
        }}
        onClick={handleSwatchClick}
        title={
          isValid
            ? `Click to edit ${displayName} Color, use checkbox to select`
            : `Invalid CSS format for ${displayName}`
        }
      >
        {/* Left side: Color name and RGB value */}
        <div className="flex flex-col items-start">
          <span
            className="font-medium text-[0.8rem]"
            style={{
              color: isValid ? textColor : "white",
              textShadow:
                needsShadow || !isValid ? "0 0 2px rgba(0,0,0,0.8)" : "none",
            }}
          >
            {displayName}
          </span>
          <span
            className="text-[0.65rem] opacity-80"
            style={{
              color: isValid ? textColor : "white",
              textShadow:
                needsShadow || !isValid ? "0 0 2px rgba(0,0,0,0.8)" : "none",
            }}
          >
            {isValid
              ? `RGB(${storedValue?.replace(/\s+/g, ", ")})`
              : "Invalid format"}
          </span>
        </div>

        {/* Right side: Checkbox */}
        {onSelectionChange && (
          <div className="flex items-center ml-1">
            <input
              type="checkbox"
              checked={selectedColors.includes(name)}
              onChange={e => {
                e.stopPropagation();
                handleCheckboxChange(name, e.target.checked);
              }}
              className="w-5 h-5 rounded border-2 border-white bg-black/70 checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 shadow-lg"
              onClick={e => e.stopPropagation()}
            />
          </div>
        )}

        {/* Error indicator */}
        {!isValid && (
          <div className="absolute -right-3 -top-3 text-error bg-background-dark/90 rounded-full p-0.5 h-5 w-5 flex items-center justify-center">
            <span className="i-mdi:alert-circle text-xs"></span>
          </div>
        )}
      </div>
    </div>
  );
}
