import { SVGProps } from "react";

export const ClockIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M0.600006 6.59961C0.600006 7.38754 0.755201 8.16776 1.05673 8.89571C1.35826 9.62366 1.80021 10.2851 2.35737 10.8422C2.91452 11.3994 3.57595 11.8414 4.30391 12.1429C5.03186 12.4444 5.81208 12.5996 6.60001 12.5996C7.38794 12.5996 8.16815 12.4444 8.89611 12.1429C9.62406 11.8414 10.2855 11.3994 10.8426 10.8422C11.3998 10.2851 11.8418 9.62366 12.1433 8.89571C12.4448 8.16776 12.6 7.38754 12.6 6.59961C12.6 5.00831 11.9679 3.48219 10.8426 2.35697C9.71743 1.23175 8.19131 0.599609 6.60001 0.599609C5.00871 0.599609 3.48258 1.23175 2.35737 2.35697C1.23215 3.48219 0.600006 5.00831 0.600006 6.59961Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.60001 3.2666V6.59993L8.60001 8.59994"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
