import { ReactNode } from "react";
import { Card } from "../../../components/Card";

type StepCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  action: ReactNode;
};

export const StepCard = (props: StepCardProps) => {
  return (
    <Card className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between p-4 md:p-6">
      <div className="flex flex-col gap-4">
        {props.title && (
          <p className="text-lg text-base-contrast">{props.title}</p>
        )}
        <p className="text-sm text-base-contrast-54 w-full">
          {props.description}
        </p>
      </div>
      <div className="flex gap-1 items-center justify-end shrink-0 w-full md:w-auto">
        {props.action}
      </div>
    </Card>
  );
};
