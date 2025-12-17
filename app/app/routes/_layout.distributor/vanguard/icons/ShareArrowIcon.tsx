import { SVGProps, useId } from "react";

export const ShareArrowIcon = (props: SVGProps<SVGSVGElement>) => {
  const maskId = useId();

  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <mask
        id={maskId}
        style={{ maskType: "alpha" }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="16"
        height="16"
      >
        <rect width="16" height="16" fill="#D9D9D9" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          d="M4.05001 12.0002L3.20001 11.1502L9.95001 4.4002H4.00001V3.2002H12V11.2002H10.8V5.2502L4.05001 12.0002Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
};
