import { useMemo, useState } from "react";
import { BackDexDashboard } from "../../components/BackDexDashboard";
import { PointCampaignForm } from "./components/PointCampaignForm";
import { PointCampaignList } from "~/routes/_layout.points/components/PointCampaignList";
import { EnablePointsCard } from "~/routes/_layout.points/components/EnablePointsCard";
import { OrderlyKeyAuthGrard } from "~/components/authGrard/OrderlyKeyAuthGuard";
import { modal, startViewTransition } from "@orderly.network/ui";
import { GraduationAuthGuard } from "~/components/authGrard/GraduationAuthGuard";
import { PointCampaign } from "~/types/points";
import {
  useDeletePointsStage,
  usePointsStages,
} from "./hooks/usePointsService";

export default function PointRoute() {
  const [type, setType] = useState<"create" | "edit" | "view" | null>(null);
  const [currentPoints, setCurrentPoints] = useState<PointCampaign | null>(
    null
  );

  const { data, mutate: mutatePointsStages } = usePointsStages();

  const [deletePointCampaign, { isMutating: isDeleting }] =
    useDeletePointsStage();

  const handleCreate = () => {
    startViewTransition(() => {
      setType("create");
    });
  };

  const handleEdit = (campaign: PointCampaign) => {
    setCurrentPoints(campaign);
    setType("edit");
  };

  const handleView = (campaign: PointCampaign) => {
    setCurrentPoints(campaign);
    startViewTransition(() => {
      setType("view");
    });
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
      onOk: () => {
        return deletePointCampaign({});
      },
    });
  };

  const onClose = () => {
    startViewTransition(() => {
      setType(null);
    });
    setCurrentPoints(null);
  };

  const onRefresh = () => {
    mutatePointsStages();
  };

  const nextStage = useMemo(() => {
    return data?.length ? (data[data.length - 1].epoch_period || 0) + 1 : 0;
  }, [data, currentPoints]);

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
            <EnablePointsCard />
            <PointCampaignList
              data={data}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreate={handleCreate}
            />
          </GraduationAuthGuard>
        </OrderlyKeyAuthGrard>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl mt-26 pb-52 font-semibold">
      {renderContent()}
    </div>
  );
}
