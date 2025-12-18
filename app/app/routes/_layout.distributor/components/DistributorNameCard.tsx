import { useState } from "react";
import { Card } from "../../../components/Card";
import FormInput from "../../../components/FormInput";
import { useMutation } from "../../../net";
import {
  alphanumericWithSpecialChars,
  composeValidators,
  maxLength,
  minLength,
  required,
} from "../../../utils/validation";
import { toast } from "react-toastify";
import { Button } from "../../../components/Button";

type DistributorNameCardProps = {
  onSuccess: () => void;
};

export const DistributorNameCard = (props: DistributorNameCardProps) => {
  const [error, setError] = useState<string | null>(null);

  const [distributorName, setDistributorName] = useState("");

  const [updateAmbassadorName, { isMutating }] = useMutation(
    "/v1/orderly_one/vanguard/ambassador_name"
  );

  const distributorNameValidator = composeValidators(
    required("Distributor name"),
    minLength(4, "Distributor name"),
    maxLength(30, "Distributor name"),
    alphanumericWithSpecialChars("Distributor name")
  );

  const handleUpdateAmbassadorName = async () => {
    try {
      const res = await updateAmbassadorName({
        ambassador_name: distributorName,
      });
      if (res.success) {
        toast.success("Configure profile");
        props.onSuccess();
      }
    } catch (error: any) {
      console.error("Error updating ambassador name:", error);
      toast.error(error?.message || "Failed to update ambassador name");
    }
  };

  const disabled = !!error || !distributorName.trim() || isMutating;

  return (
    <Card className="flex flex-col gap-5 p-4 md:p-6">
      {/* Header */}
      <p className="text-lg text-base-contrast">Distributor details</p>

      {/* Separator line */}
      <div className="h-px w-full bg-base-contrast-12"></div>

      {/* Content */}
      <div className="flex flex-col gap-4 items-start">
        {/* Help text above input */}
        <p className="text-sm text-base-contrast-54">
          Provide a name for your distributor profile. This name will be used in
          the HTML metadata, environment configuration, and other places
          throughout the Orderly One ecosystem.
        </p>

        <FormInput
          id="distributorName"
          value={distributorName}
          onChange={e => setDistributorName(e.target.value)}
          placeholder="Distributor name"
          className="w-full"
          required={true}
          minLength={4}
          maxLength={30}
          validator={distributorNameValidator}
          onError={setError}
        />

        {/* Validation hint text */}
        <p className="text-sm text-base-contrast-54">
          Alphanumeric characters, spaces, dots, hyphens, and underscores only.
          Other special characters are not permitted.
        </p>
      </div>

      {/* Confirm button */}
      <div className="flex justify-end w-full mt-4">
        <Button
          variant="primary"
          size="md"
          disabled={disabled}
          onClick={handleUpdateAmbassadorName}
          isLoading={isMutating}
        >
          Confirm
        </Button>
      </div>
    </Card>
  );
};
