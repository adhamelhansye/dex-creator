import { useEffect, useState } from "react";
import { DatePicker, modal } from "@orderly.network/ui";
import { Switch } from "../../../components/switch";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { FormLabel } from "./FormLabel";
import { PointFormInput } from "./PointFormInput";
import { Tooltip } from "../../../components/tooltip";
import { TooltipIcon } from "../../../icons/TooltipIcon";
import { formatDate } from "~/utils/date";
import { add } from "date-fns";
import { toast } from "react-toastify";
import { cn } from "~/utils/css";
import { PointCampaign } from "~/types/points";
import {
  useUpdatePointsStage,
  usePointsDetail,
} from "../hooks/usePointsService";

type PointCampaignFormProps = {
  type: "create" | "edit" | "view";
  currentPoints?: PointCampaign | null;
  nextStage: number;
  close: () => void;
  refresh: () => void;
};

export function PointCampaignForm(props: PointCampaignFormProps) {
  const { currentPoints, type, nextStage } = props;
  const [stageName, setStageName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isRecurring, setIsRecurring] = useState(false);
  const [tradingVolume, setTradingVolume] = useState("0.1");
  const [pnl, setPnl] = useState("1");
  const [l1ReferralRate, setL1ReferralRate] = useState("10");
  const [l2ReferralRate, setL2ReferralRate] = useState("5");
  const [errors, setErrors] = useState<{
    stageName?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    tradingVolume?: string;
    pnl?: string;
    l1ReferralRate?: string;
    l2ReferralRate?: string;
  }>({});

  const { data: pointDetail } = usePointsDetail(currentPoints?.stage_id);

  useEffect(() => {
    if (type !== "create" && pointDetail) {
      const {
        stage_name,
        stage_description,
        start_date,
        end_date,
        volume_boost,
        pnl_boost,
        l1_referral_boost,
        l2_referral_boost,
      } = pointDetail;

      setStageName(stage_name);
      setDescription(stage_description);
      start_date && setStartDate(new Date(start_date));
      end_date && setEndDate(new Date(end_date));
      setIsRecurring(!end_date);
      setTradingVolume(volume_boost?.toString());
      setPnl(pnl_boost?.toString());
      setL1ReferralRate(l1_referral_boost?.toString());
      setL2ReferralRate(l2_referral_boost?.toString());
    }
  }, [type, pointDetail, nextStage]);

  const stages =
    type === "create"
      ? nextStage?.toString()
      : pointDetail?.epoch_period?.toString();

  useEffect(() => {
    // clear form when close form
    if (!type) {
      setStageName("");
      setDescription("");
      setStartDate(undefined);
      setEndDate(undefined);
      setIsRecurring(false);
      setTradingVolume("0.1");
      setPnl("1");
      setL1ReferralRate("10");
      setL2ReferralRate("5");
      setErrors({});
    }
  }, [type]);

  const [updatePointCampaign, { isMutating }] = useUpdatePointsStage();

  const operateCampaign = async () => {
    try {
      const res = await updatePointCampaign({
        stage_id: type === "edit" ? pointDetail?.stage_id : undefined,
        stage_name: stageName,
        stage_description: description,
        start_date: formatDate(startDate, "yyyy-MM-dd"),
        end_date: isRecurring ? undefined : formatDate(endDate, "yyyy-MM-dd"),
        is_continuous: isRecurring,
        volume_boost: Number(tradingVolume ?? 0.1),
        pnl_boost: Number(pnl ?? 1),
        l1_referral_boost: Number(l1ReferralRate ?? 10),
        l2_referral_boost: Number(l2ReferralRate ?? 5),
      });

      if (res.success) {
        if (type === "create") {
          toast.success(
            <div>
              Campaign created successfully
              <div className="text-[13px] text-base-contrast-54">
                You can now view and manage it in the campaign list.
              </div>
            </div>
          );
        } else if (type === "edit") {
          toast.success(
            <div>
              Campaign updated successfully
              <div className="text-[13px] text-base-contrast-54">
                It may take some time for changes to process.
              </div>
            </div>
          );
        }
        props.refresh();
        props.close();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error("Error creating campaign:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
      return err;
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (stageName.trim() === "") {
      newErrors.stageName = "Campaign title is required";
    }

    const stageNameWordCount = stageName
      ?.trim()
      ?.split(/\s+/)
      ?.filter(word => word.length > 0).length;
    if (stageName?.trim()?.length && stageNameWordCount > 5) {
      newErrors.stageName = "Campaign title must be less than 5 words";
    }

    const descriptionWordCount = description
      ?.trim()
      ?.split(/\s+/)
      ?.filter(word => word.length > 0).length;

    if (description?.trim()?.length && descriptionWordCount > 100) {
      newErrors.description = "Description must be less than 100 words";
    }

    if (startDate === undefined) {
      newErrors.startDate = "Start date is required";
    }

    if (!isRecurring) {
      if (endDate === undefined) {
        newErrors.endDate = "End date is required";
      } else if (startDate && endDate.valueOf() < startDate.valueOf()) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    if (tradingVolume === "") {
      newErrors.tradingVolume = "Trading volume is required";
    }
    if (pnl === "") {
      newErrors.pnl = "PNL is required";
    }
    if (l1ReferralRate === "") {
      newErrors.l1ReferralRate = "L1 referral rate is required";
    }
    if (l2ReferralRate === "") {
      newErrors.l2ReferralRate = "L2 referral rate is required";
    }

    setErrors(newErrors);
    const keys = Object.keys(newErrors);
    if (keys.length > 0) {
      toast.error(newErrors[keys[0] as keyof typeof newErrors]);
      return false;
    }

    if (keys.length > 0) {
      toast.error("Please fix validation errors before saving");
      return false;
    }

    return true;
  };

  const handlePublish = () => {
    if (!validateForm()) {
      return;
    }
    modal.confirm({
      title: "Publish Campaign?",
      okLabel: "Confirm Publish",
      content: (
        <span className="text-warning">
          Please confirm that you want to publish this campaign. Once published,
          it cannot be deleted or withdrawn, but you may continue to modify its
          parameters.
        </span>
      ),
      size: "md",
      onOk: operateCampaign,
    });
  };

  const tomorrow = add(new Date(), { days: 1 });

  const getTitle = () => {
    if (type === "create") {
      return "Create Your Points Campaign";
    } else if (type === "edit") {
      return "Edit Your Points Campaign";
    } else if (type === "view") {
      return "View Your Points Campaign";
    }
  };

  const readonly = type === "view";

  return (
    <div>
      <div
        className="text-sm text-gray-400 hover:text-primary-light mb-2 inline-flex items-center"
        onClick={props.close}
      >
        <div className="i-mdi:arrow-left h-4 w-4 mr-1"></div>
        Back to Point Campaign Setup
      </div>

      <h1 className="text-lg md:text-2xl font-bold gradient-text">
        {getTitle()}
      </h1>
      <Card className="p-4 md:p-8 bg-white/[0.04] border-line-12 mt-6 md:mt-12">
        <div className="flex flex-col gap-8">
          {/* Basic information section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-base-contrast-80 leading-6 tracking-[0.48px]">
              Basic information
            </h2>

            {/* Campaign Title and Stages row */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <PointFormInput
                  label="Campaign Title"
                  value={stageName}
                  onChange={e => {
                    setStageName(e.target.value);
                    if (errors.stageName) {
                      setErrors(prev => ({ ...prev, stageName: undefined }));
                    }
                  }}
                  disabled={readonly}
                  error={!!errors.stageName}
                  errorMessage={errors.stageName}
                />
              </div>
              <div className="flex-1">
                <PointFormInput
                  label="Stages"
                  tooltip="This default number will increase as more campaigns are created. The stage is mainly used to help organize and track data in the future."
                  value={stages || ""}
                  disabled
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <PointFormInput
                label="Description"
                type="textarea"
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  if (errors.description) {
                    setErrors(prev => ({ ...prev, description: undefined }));
                  }
                }}
                disabled={readonly}
                error={!!errors.description}
                errorMessage={errors.description}
              />
            </div>

            {/* Start Date and End Date row */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div>
                  <FormLabel label="Start Date (UTC)" className="h-5" />
                  <DatePicker
                    value={startDate}
                    onChange={date => {
                      setStartDate(date);
                      if (errors.startDate) {
                        setErrors(prev => ({ ...prev, startDate: undefined }));
                      }
                    }}
                    disabled={{ before: new Date(tomorrow) }}
                    className={cn(
                      "w-full border bg-base-8 focus:ring-0 rounded-[6px]",
                      errors.startDate
                        ? "border-error focus:border-error"
                        : "border-transparent",
                      readonly && "pointer-events-none"
                    )}
                    placeholder="Select a date"
                  />
                  {errors.startDate ? (
                    <div className="flex items-center gap-1 mt-1 pl-1">
                      <div className="w-1 h-1 rounded-full bg-error"></div>
                      <p className="text-xs text-error leading-[18px] tracking-[0.36px]">
                        {errors.startDate}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mt-1 pl-1">
                      <div className="w-1 h-1 rounded-full bg-base-contrast-54"></div>
                      <p className="text-xs text-base-contrast-54 leading-[18px] tracking-[0.36px]">
                        Starts at 00:00:00 UTC
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1 md:mb-2 flex-wrap">
                    <FormLabel
                      label="End Date (UTC)"
                      className="mb-0 md:mb-0"
                    />
                    <div className="flex items-center gap-1">
                      <Tooltip
                        delayDuration={300}
                        align="center"
                        sideOffset={4}
                        className="max-w-[276px]"
                        content="You can leave the end time unset for now. Before creating a new campaign, please set the end date for the current one."
                      >
                        <TooltipIcon />
                      </Tooltip>
                      <span className="text-xs font-semibold text-base-contrast-54 whitespace-nowrap">
                        Recurring
                      </span>
                      <Switch
                        checked={isRecurring}
                        onCheckedChange={value => {
                          setIsRecurring(value);
                          if (errors.endDate) {
                            setErrors(prev => ({
                              ...prev,
                              endDate: undefined,
                            }));
                          }
                        }}
                        disabled={readonly}
                      />
                    </div>
                  </div>

                  {isRecurring ? (
                    <PointFormInput
                      value={"Recurring"}
                      classNames={{ root: "mb-0" }}
                      disabled
                    />
                  ) : (
                    <DatePicker
                      value={endDate}
                      onChange={date => {
                        setEndDate(date);
                        if (errors.endDate) {
                          setErrors(prev => ({ ...prev, endDate: undefined }));
                        }
                      }}
                      disabled={{ before: startDate || tomorrow }}
                      className={cn(
                        "w-full border bg-base-8 focus:ring-0 rounded-[6px]",
                        errors.endDate
                          ? "border-error focus:border-error"
                          : "border-transparent",
                        readonly && "pointer-events-none"
                      )}
                      placeholder="Select a date"
                    />
                  )}
                  {!isRecurring && (
                    <>
                      {errors.endDate ? (
                        <div className="flex items-center gap-1 mt-1 pl-1">
                          <div className="w-1 h-1 rounded-full bg-error"></div>
                          <p className="text-xs text-error leading-[18px] tracking-[0.36px]">
                            {errors.endDate}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mt-1 pl-1">
                          <div className="w-1 h-1 rounded-full bg-base-contrast-54"></div>
                          <p className="text-xs text-base-contrast-54 leading-[18px] tracking-[0.36px]">
                            Ends at 23:59:59 UTC
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Coefficient section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-base-contrast-80 leading-6 tracking-[0.48px]">
              Coefficient
            </h2>

            {/* Trading volume and PNL row */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <PointFormInput
                  type="number"
                  label="Trading volume"
                  value={tradingVolume}
                  onChange={e => {
                    setTradingVolume(e.target.value);
                    if (errors.tradingVolume) {
                      setErrors(prev => ({
                        ...prev,
                        tradingVolume: undefined,
                      }));
                    }
                  }}
                  helpText={`Trading points = perp_volume × ${tradingVolume || 0.1}`}
                  disabled={readonly}
                  error={!!errors.tradingVolume}
                  errorMessage={errors.tradingVolume}
                />
              </div>
              <div className="flex-1">
                <PointFormInput
                  type="number"
                  label="PNL"
                  tooltip="The profit or loss of each trade will be recorded in absolute value."
                  value={pnl}
                  onChange={e => {
                    setPnl(e.target.value);
                    if (errors.pnl) {
                      setErrors(prev => ({ ...prev, pnl: undefined }));
                    }
                  }}
                  helpText={`PNL points = |PNL| × ${pnl || 1}`}
                  disabled={readonly}
                  error={!!errors.pnl}
                  errorMessage={errors.pnl}
                />
              </div>
            </div>

            {/* L1 and L2 Referral rate row */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <PointFormInput
                  type="number"
                  label="L1 Referral rate(%)"
                  tooltip="Points earned from the first-level invitee's invitees"
                  value={l1ReferralRate}
                  onChange={e => {
                    setL1ReferralRate(e.target.value);
                    if (errors.l1ReferralRate) {
                      setErrors(prev => ({
                        ...prev,
                        l1ReferralRate: undefined,
                      }));
                    }
                  }}
                  helpText={`The first-level invitee's rebate inviter ${l1ReferralRate || 10}% of their points`}
                  disabled={readonly}
                  error={!!errors.l1ReferralRate}
                  errorMessage={errors.l1ReferralRate}
                />
              </div>
              <div className="flex-1">
                <PointFormInput
                  type="number"
                  label="L2 Referral rate(%)"
                  tooltip="Second-level referral rate percentage"
                  value={l2ReferralRate}
                  onChange={e => {
                    setL2ReferralRate(e.target.value);
                    if (errors.l2ReferralRate) {
                      setErrors(prev => ({
                        ...prev,
                        l2ReferralRate: undefined,
                      }));
                    }
                  }}
                  helpText={`The second-level invitee's rebate inviter ${l2ReferralRate || 5}% of their points`}
                  disabled={readonly}
                  error={!!errors.l2ReferralRate}
                  errorMessage={errors.l2ReferralRate}
                />
              </div>
            </div>
          </div>

          {/* Save & Publish button */}
          {!readonly && (
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={handlePublish}
                isLoading={isMutating}
              >
                Save & Publish
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
