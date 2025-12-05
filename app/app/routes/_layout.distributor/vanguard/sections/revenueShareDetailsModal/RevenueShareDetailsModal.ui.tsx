import React from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  useRevenueShareDetailsColumn,
  RevenueShareDetailRecord,
} from "./useRevenueShareDetailsColumn";
import { formatCurrency, getUserTimezone } from "../../utils";
import { Pagination } from "../../components";

export interface RevenueShareDetailsModalUIProps {
  open: boolean;
  onClose: () => void;
  data: any;
  dataSource: RevenueShareDetailRecord[];
  isLoading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

const RevenueShareDetailsModalUI: React.FC<RevenueShareDetailsModalUIProps> = ({
  open,
  onClose,
  data,
  dataSource,
  isLoading,
  pagination,
}) => {
  const columns = useRevenueShareDetailsColumn();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) {
          onClose();
        }
      }}
      title="Revenue share details"
      onCancel={onClose}
      cancelText="Close"
      contentClassName="w-[900px]"
      footer={null}
    >
      <div className="flex flex-col">
        <div className="flex flex-col gap-6">
          <div className="flex gap-20">
            <div>
              <div className="mb-1 text-sm font-medium leading-[125%] text-base-contrast-54">
                Total revenue share
              </div>
              <div className="text-sm font-medium leading-[125%] text-base-contrast">
                {formatCurrency(data?.totalRevenueShare, {
                  floor: true,
                  precison: 2,
                })}
              </div>
            </div>
            <div>
              <div className="mb-1 text-sm font-medium leading-[125%] text-base-contrast-54">
                Total invitee volume
              </div>
              <div className="text-sm font-medium leading-[125%] text-base-contrast">
                {formatCurrency(data?.totalInviteeVolume, {
                  floor: true,
                  precison: 2,
                })}
              </div>
            </div>
          </div>
          <div>
            <div className="mb-1 text-sm font-medium leading-[125%] text-base-contrast-54">
              Period
            </div>
            <div className="text-sm font-medium leading-[125%] text-base-contrast flex flex-col">
              <span>{data?.periodStartTime || "--"}</span>
              <span>{data?.periodEndTime || "--"}</span>
            </div>
          </div>
          <div>
            <div className="mb-1 text-sm font-medium leading-[125%] text-base-contrast-54">
              Distribution time ({getUserTimezone()})
            </div>
            <div className="text-sm font-medium leading-[125%] text-base-contrast">
              {data?.distributionTime || "--"}
            </div>
          </div>
          <div className="h-px bg-white/10" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="animate-pulse space-y-4 py-4">
              <div className="h-8 bg-base-700 rounded" />
              <div className="h-8 bg-base-700 rounded" />
            </div>
          ) : (
            <table className="w-full min-w-[600px]">
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
                      No data
                    </td>
                  </tr>
                ) : (
                  dataSource.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="border-b border-base-contrast-12"
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
          )}
        </div>

        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={pagination.onPageChange}
        />
      </div>
    </ConfirmDialog>
  );
};

export default RevenueShareDetailsModalUI;
