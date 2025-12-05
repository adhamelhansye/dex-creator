import React from "react";
import { useRevenueColumn } from "./useRevenueColumn";
import { RevenueShareDetailsModalUI } from "../revenueShareDetailsModal";
import type { RevenueShareDetailsModalUIProps } from "../revenueShareDetailsModal";
import { Pagination } from "../../components";

interface RevenueShareListUIProps {
  dataSource: any[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  isLoading: boolean;
  onViewDetails: (record: any) => void;
  revenueShareDetailsModalUiProps: RevenueShareDetailsModalUIProps;
}

const RevenueShareListUI: React.FC<RevenueShareListUIProps> = ({
  dataSource,
  pagination,
  isLoading,
  onViewDetails,
  revenueShareDetailsModalUiProps,
}) => {
  const columns = useRevenueColumn({ onViewDetails });

  if (isLoading) {
    return (
      <div className="bg-purple-dark rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-base-700 rounded" />
          <div className="h-10 bg-base-700 rounded" />
          <div className="h-10 bg-base-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-purple-dark rounded-lg p-6 overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-base-contrast-12">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="h-[46px] text-left text-sm font-medium text-base-contrast-54 px-3"
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataSource.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-8 text-base-contrast-54"
              >
                No revenue share history yet
              </td>
            </tr>
          ) : (
            dataSource.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                className="border-b border-base-contrast-12 hover:bg-base-700/50"
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className="py-3 px-3 text-sm text-base-contrast"
                  >
                    {col.render
                      ? col.render(row[col.dataIndex], row)
                      : row[col.dataIndex]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Pagination
        current={pagination.current}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onPageChange={pagination.onPageChange}
      />

      <RevenueShareDetailsModalUI {...revenueShareDetailsModalUiProps} />
    </div>
  );
};

export default RevenueShareListUI;
