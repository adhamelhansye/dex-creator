import {
  DataTable,
  Button as OrderlyButton,
  usePagination,
} from "@orderly.network/ui";
import { Button } from "../../../components/Button";
import { useMemo } from "react";
import { formatUTCDate } from "../../../utils/date";
import { cn } from "~/utils/css";
import { PointCampaign, PointCampaignStatus } from "~/types/points";
import { Tooltip } from "~/components/tooltip";
import { getPointCampaignStatus } from "../utils";

type PointCampaignListProps = {
  data?: PointCampaign[];
  onView: (campaign: PointCampaign) => void;
  onEdit: (campaign: PointCampaign) => void;
  onCreate: () => void;
  onDelete: (campaign: PointCampaign) => void;
  disabledCreate: boolean;
};

export function PointCampaignList(props: PointCampaignListProps) {
  const { data, disabledCreate } = props;
  const { page, pageSize, parsePagination } = usePagination();

  const pagination = useMemo(
    () =>
      parsePagination({
        total: data?.length ?? 0,
        current_page: page,
        records_per_page: pageSize,
      }),
    [parsePagination, page, pageSize, data?.length]
  );

  const columns = useMemo(
    () => [
      {
        title: "Stage",
        dataIndex: "epoch_period",
        width: 50,
      },
      {
        title: "Status",
        dataIndex: "status",
        width: 60,
        render: (_: any, record: PointCampaign) => {
          const status = getPointCampaignStatus(record);
          return (
            <span
              className={cn({
                "text-base-contrast-80":
                  status === PointCampaignStatus.ReadyToGo,
                "text-success": status === PointCampaignStatus.Ongoing,
                "text-base-contrast-36": status === PointCampaignStatus.Ended,
              })}
            >
              {status}
            </span>
          );
        },
      },
      {
        title: "Title",
        dataIndex: "stage_name",
        render: (stage_name: string) => {
          return <div className="py-2">{stage_name}</div>;
        },
      },
      {
        title: "Time",
        dataIndex: "start_time",
        render: (_: any, record: PointCampaign) => {
          const { start_time, end_time } = record;
          const formatStr = "MM/dd/yyyy";
          return (
            <span>
              {formatUTCDate(start_time * 1000, formatStr)} -{" "}
              {end_time
                ? formatUTCDate(end_time * 1000, formatStr)
                : "Recurring"}
            </span>
          );
        },
      },
      {
        title: "Action",
        dataIndex: "action",
        width: 80,
        render: (_: any, record: PointCampaign) => {
          const status = getPointCampaignStatus(record);
          return (
            <div>
              {status === PointCampaignStatus.Ended && (
                <OrderlyButton
                  variant="text"
                  color="primary"
                  size="sm"
                  onClick={() => props.onView(record)}
                >
                  View
                </OrderlyButton>
              )}
              {status !== PointCampaignStatus.Ended && (
                <OrderlyButton
                  variant="text"
                  color="primary"
                  size="sm"
                  onClick={() => props.onEdit(record)}
                >
                  Edit
                </OrderlyButton>
              )}

              {status === PointCampaignStatus.ReadyToGo && (
                <OrderlyButton
                  variant="text"
                  color="danger"
                  size="sm"
                  onClick={() => props.onDelete(record)}
                >
                  Delete
                </OrderlyButton>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div>
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="text-sm md:text-base font-semibold">
          Point Campaign List
        </div>

        <Tooltip content="Please enable the Point System first to create a campaign.">
          <Button
            variant="primary"
            size="sm"
            onClick={props.onCreate}
            disabled={disabledCreate}
          >
            Create
          </Button>
        </Tooltip>
      </div>

      <DataTable
        classNames={{
          root: "mt-4 px-3 rounded bg-[rgb(19,21,25)]",
          header: "border-b border-b-line-4",
          body: "font-medium",
        }}
        columns={columns}
        dataSource={data}
        pagination={pagination}
        emptyView={
          <div className="text-sm md:text-base my-4 text-base-contrast-54">
            No campaigns
          </div>
        }
      />
    </div>
  );
}
