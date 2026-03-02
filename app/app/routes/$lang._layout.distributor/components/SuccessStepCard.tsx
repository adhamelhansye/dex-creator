import { Card } from "../../../components/Card";

export const SuccessStepCard = ({
  title,
  value,
}: {
  title: string;
  value?: string;
}) => {
  return (
    <Card className="w-full p-4 md:p-6">
      <div className="flex gap-1 items-center w-full opacity-50">
        <div className="shrink-0 size-6">
          <div className="i-mdi:check-circle text-success size-6"></div>
        </div>
        <p className="text-lg text-base-contrast grow">{title}</p>
        {value && (
          <p className="text-lg text-base-contrast text-right whitespace-nowrap">
            {value}
          </p>
        )}
      </div>
    </Card>
  );
};
