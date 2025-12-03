import React from "react";
import { Tooltip } from "@orderly.network/ui";

interface TableTitleWithTooltipProps {
  title: string;
  tooltip: string;
}

export const TableTitleWithTooltip: React.FC<TableTitleWithTooltipProps> = ({
  title,
  tooltip,
}) => {
  return (
    <Tooltip
      delayDuration={300}
      align="center"
      sideOffset={4}
      arrow={{
        className: "!fill-purple-light",
      }}
      className="max-w-[276px] px-3 !bg-purple-light py-2 rounded-lg whitespace-pre-line break-words leading-[17.5px] text-xs text-white"
      content={tooltip}
    >
      <span className="border-b border-dashed border-base-contrast-54 cursor-pointer">
        {title}
      </span>
    </Tooltip>
  );
};

export default TableTitleWithTooltip;
