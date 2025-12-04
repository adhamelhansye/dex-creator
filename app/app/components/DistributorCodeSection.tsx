import React, { useEffect, useState } from "react";
import FormInput from "./FormInput";
import { useDistributorCode } from "../hooks/useDistrubutorInfo";
import clsx from "clsx";
import { useAuth } from "../context/useAuth";
export interface BrokerDetailsProps {
  distributorCode: string;
  handleInputChange: (
    field: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  distributorCodeValidator: (value: string) => string | null;
}

const DistributorCodeSection: React.FC<BrokerDetailsProps> = props => {
  const { distributorCode, handleInputChange, distributorCodeValidator } =
    props;
  const distributorCodeFromUrl = useDistributorCode();
  const [showClearIcon, setShowClearIcon] = useState(!!distributorCodeFromUrl);

  // dont't watch, get disabled status when init
  const [disabled, setDisabled] = useState(showClearIcon);

  const { distributorInfo } = useAuth();

  const isBound = !!distributorInfo?.exist;

  useEffect(() => {
    if (isBound) {
      setDisabled(true);
      setShowClearIcon(false);
    }
  }, [isBound]);

  const onClear = () => {
    handleInputChange("distributorCode")({
      target: {
        value: "",
      },
    } as React.ChangeEvent<HTMLInputElement>);
    setDisabled(false);
  };

  const label = isBound ? "Your distributor" : "Distributor code";
  const value = distributorInfo?.distributor_name || distributorCode;
  const helpText = isBound
    ? ""
    : "Alphanumeric characters only. Other special characters and spaces are not permitted.";

  return (
    <FormInput
      id="distributorCode"
      label={label}
      value={value}
      onChange={handleInputChange("distributorCode")}
      placeholder="Distributor code"
      helpText={helpText}
      maxLength={isBound ? undefined : 10}
      validator={isBound ? undefined : distributorCodeValidator}
      disabled={disabled}
      suffix={showClearIcon && <DistributorCodeSuffix onClick={onClear} />}
    />
  );
};

export default DistributorCodeSection;

const DistributorCodeSuffix: React.FC<{
  onClick?: () => void;
}> = props => {
  return (
    <div
      className={clsx(
        "h-full absolute right-0 top-0",
        "flex items-center justify-center",
        "cursor-pointer mx-4"
      )}
      onClick={props.onClick}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 21C6.45 21 5.97933 20.8043 5.588 20.413C5.19667 20.0217 5.00067 19.5507 5 19V6H4V4H9V3H15V4H20V6H19V19C19 19.55 18.8043 20.021 18.413 20.413C18.0217 20.805 17.5507 21.0007 17 21H7ZM9 17H11V8H9V17ZM13 17H15V8H13V17Z"
          fill="white"
          fill-opacity="0.36"
        />
      </svg>
    </div>
  );
};
