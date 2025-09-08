import React from "react";
import FormInput from "./FormInput";

export interface BrokerDetailsProps {
  brokerName: string;
  handleInputChange: (
    field: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  brokerNameValidator: (value: string) => string | null;
}

const BrokerDetailsSection: React.FC<BrokerDetailsProps> = ({
  brokerName,
  handleInputChange,
  brokerNameValidator,
}) => (
  <FormInput
    id="brokerName"
    label="Broker Name"
    value={brokerName}
    onChange={handleInputChange("brokerName")}
    placeholder="Enter your broker name"
    helpText="This name will be used in the HTML metadata, environment configuration, and other places throughout your DEX. Must be 3-50 characters and can only contain letters, numbers, spaces, dots, hyphens, and underscores."
    required={true}
    minLength={3}
    maxLength={50}
    validator={brokerNameValidator}
  />
);

export default BrokerDetailsSection;
