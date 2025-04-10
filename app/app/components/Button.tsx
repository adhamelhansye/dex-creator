import { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import { clsx } from "clsx";
import React from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonAsButton = {
  as?: "button";
} & ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonAsAnchor = {
  as: "a";
} & AnchorHTMLAttributes<HTMLAnchorElement>;

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  loadingIndicator?: React.ReactNode;
  loadingText?: string;
  withGlow?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
} & (ButtonAsButton | ButtonAsAnchor);

export function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  isLoading = false,
  loadingIndicator,
  loadingText,
  withGlow = false,
  children,
  as = "button",
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "rounded-full py-2 px-6 font-medium transition-all duration-200 cursor-pointer border-none";

  const sizeClasses = {
    sm: "text-sm py-1.5 px-4",
    md: "py-2 px-6",
    lg: "text-lg py-2.5 px-8",
  };

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-primary to-secondary text-white shadow-glow hover:from-primary-light hover:to-secondary-light hover:shadow-glow-hover hover:transform hover:-translate-y-0.5",
    secondary:
      "bg-gradient-secondaryButton text-white border border-primary-light/30 hover:border-primary-light/50",
    danger: "bg-red-500 text-white hover:bg-red-600",
    ghost: "bg-transparent text-white hover:bg-white/10",
  };

  const glowClass = withGlow
    ? "relative after:absolute after:inset-0 after:rounded-full after:bg-primary/20 after:blur-lg after:transform after:scale-110 after:-z-10"
    : "";
  const disabledClass =
    disabled || isLoading ? "opacity-60 cursor-not-allowed" : "";

  const buttonContent = (
    <>
      {isLoading ? (
        <>
          {loadingIndicator || (
            <span className="mr-2 inline-block animate-spin">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  fill="currentColor"
                ></path>
              </svg>
            </span>
          )}
          {loadingText || children}
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </>
  );

  const classes = clsx(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    glowClass,
    disabledClass,
    className
  );

  if (as === "a") {
    return (
      <a
        className={classes}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {buttonContent}
      </a>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      data-variant={variant}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {buttonContent}
    </button>
  );
}
