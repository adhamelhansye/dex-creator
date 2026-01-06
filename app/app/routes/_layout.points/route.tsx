import { useMemo, useState } from "react";
import { BackDexDashboard } from "../../components/BackDexDashboard";
import { PointCampaignForm } from "./components/PointCampaignForm";
import { PointCampaignList } from "~/routes/_layout.points/components/PointCampaignList";
import { EnablePointsCard } from "~/routes/_layout.points/components/EnablePointsCard";
import { OrderlyKeyAuthGrard } from "~/components/authGrard/OrderlyKeyAuthGuard";
import { modal } from "@orderly.network/ui";
import { GraduationAuthGuard } from "~/components/authGrard/GraduationAuthGuard";
import { PointCampaign, PointCampaignFormType } from "~/types/points";
import {
  useDeletePointsStage,
  usePointsStages,
} from "./hooks/usePointsService";
import { toast } from "react-toastify";
import { useDex } from "~/context/DexContext";

export default function PointRoute() {
  const [type, setType] = useState<PointCampaignFormType | null>(null);
  const [currentPoints, setCurrentPoints] = useState<PointCampaign | null>(
    null
  );

  const { dexData } = useDex();

  const enabledMenus = useMemo(
    () => parseMenus(dexData?.enabledMenus!),
    [dexData?.enabledMenus]
  );

  const { data, mutate: mutatePointsStages } = usePointsStages();

  const [deletePointCampaign] = useDeletePointsStage(currentPoints?.stage_id);

  const handleCreate = () => {
    setType(PointCampaignFormType.Create);
  };

  const handleEdit = (campaign: PointCampaign) => {
    setCurrentPoints(campaign);
    setType(PointCampaignFormType.Edit);
  };

  const handleView = (campaign: PointCampaign) => {
    setCurrentPoints(campaign);
    setType(PointCampaignFormType.View);
  };

  const onClose = () => {
    setType(null);
    setCurrentPoints(null);
  };

  const onRefresh = () => {
    mutatePointsStages();
  };

  const doDelete = async () => {
    try {
      const res = await deletePointCampaign({});
      if (res.success) {
        toast.success(
          <div>
            Campaign deleted
            <div className="text-[13px] text-base-contrast-54">
              The campaign has been successfully removed.
            </div>
          </div>
        );
        onRefresh();
      } else {
        toast.error(res?.message || "Campaign delete failed");
      }
    } catch (err: any) {
      console.error("Error deleting campaign:", err);
      toast.error(err?.message || "Campaign delete failed");
    }
  };

  const handleDelete = (campaign: PointCampaign) => {
    setCurrentPoints(campaign);
    modal.confirm({
      title: "Delete Campaign?",
      okLabel: "Delete",
      content: (
        <span className="text-warning">
          Are you sure you want to delete this campaign? This action cannot be
          undone.
        </span>
      ),
      size: "md",
      onOk: doDelete,
    });
  };

  const nextStage = useMemo(() => {
    return data?.length ? (data[0].epoch_period || 0) + 1 : 1;
  }, [data, currentPoints]);

  const disabledCreate = useMemo(() => {
    return !enabledMenus.includes("Points");
  }, [enabledMenus]);

  const renderContent = () => {
    if (type) {
      return (
        <PointCampaignForm
          type={type}
          currentPoints={currentPoints}
          close={onClose}
          refresh={onRefresh}
          nextStage={nextStage}
        />
      );
    }

    return (
      <div>
        <BackDexDashboard />

        <h1 className="text-lg md:text-2xl font-bold gradient-text">
          Point Campaign Setup
        </h1>

        <OrderlyKeyAuthGrard className="mt-10">
          <GraduationAuthGuard className="mt-10">
            <EnablePointsCard enabledMenus={enabledMenus} />
            <PointCampaignList
              data={data}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreate={handleCreate}
              disabledCreate={disabledCreate}
            />
          </GraduationAuthGuard>
        </OrderlyKeyAuthGrard>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl mt-26 pb-52">
      {renderContent()}
    </div>
  );
}

function parseMenus(menuString?: string): string[] {
  if (!menuString) return [];
  return menuString
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}
