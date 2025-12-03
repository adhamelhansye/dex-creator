import { useOverviewScript } from "./Overview.script";
import OverviewUI from "./Overview.ui";

export default function Overview() {
  const { data, onEditCode, configureDistributorCodeModalUiProps, isLoading } =
    useOverviewScript();

  return (
    <OverviewUI
      data={data}
      onEditCode={onEditCode}
      configureDistributorCodeModalUiProps={
        configureDistributorCodeModalUiProps
      }
      isLoading={isLoading}
    />
  );
}
