import { Card } from "../../../components/Card";
import { useState } from "react";
import { PointSystemIcon } from "~/icons/PointSystemIcon";
import { Switch } from "../../../components/switch";

export function EnablePointsCard() {
  const [pointEnabled, setPointEnabled] = useState(false);

  return (
    <Card className={`my-6 md:my-12 border-line-6`}>
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PointSystemIcon className="flex-shrink-0" />

          <div>
            <h3 className="text-sm md:text-lg font-semibold mb-1">
              Enable Point System
            </h3>
            <p className="text-xs md:text-sm text-base-contrast-80">
              Once enabled, the point system will appear in the header and
              cannot be turned off for now.
            </p>
          </div>
        </div>
        <Switch
          checked={pointEnabled}
          onCheckedChange={setPointEnabled}
          className="flex-shrink-0"
        />
      </div>
    </Card>
  );
}
