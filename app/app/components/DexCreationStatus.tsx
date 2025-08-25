import { Card } from "./Card";
import { Button } from "./Button";
import WorkflowStatus from "./WorkflowStatus";

interface DexData {
  id: string;
  repoUrl?: string | null;
  customDomain?: string | null;
}

interface DexCreationStatusProps {
  dexData: DexData | null;
  deploymentUrl: string | null;
  deploymentConfirmed: boolean;
  isForking: boolean;
  handleRetryForking: () => void;
  handleSuccessfulDeployment: (url: string, isNewDeployment: boolean) => void;
}

export default function DexCreationStatus({
  dexData,
  deploymentUrl,
  deploymentConfirmed,
  isForking,
  handleRetryForking,
  handleSuccessfulDeployment,
}: DexCreationStatusProps) {
  if (!dexData) return null;

  if (dexData.repoUrl) {
    return (
      <Card variant="success" className="mb-6" id="dex-creation-status">
        <h3 className="text-lg font-bold mb-2">DEX Creation Status</h3>
        <p className="text-sm text-gray-300 mb-4">
          We've created the source code for your DEX! Here's what's happening
          now:
        </p>

        <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <h4 className="text-base font-bold mb-2 flex items-center">
            <div className="i-mdi:code-tags text-primary-light mr-2 h-5 w-5"></div>
            Step 1: Source Code Created
          </h4>
          <p className="text-sm text-gray-300 mb-2">
            We've created a GitHub repository containing all the code needed for
            your DEX. Think of this as the blueprint for your exchange:
          </p>
          <a
            href={dexData.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-light hover:underline break-all mb-1 flex items-center text-sm"
          >
            <span className="break-all">{dexData.repoUrl}</span>
            <div className="i-mdi:open-in-new h-4 w-4 ml-1 flex-shrink-0"></div>
          </a>
          <p className="text-xs text-gray-400 italic">
            (You don't need to do anything with this link unless you're a
            developer)
          </p>
        </div>

        {deploymentUrl && deploymentConfirmed ? (
          <div className="mb-4 p-3 bg-success/10 rounded-lg border border-success/20 slide-fade-in">
            <h4 className="text-base font-bold mb-2 flex items-center">
              <div className="i-mdi:check-circle text-success mr-2 h-5 w-5"></div>
              Step 2: Your DEX is Live!
            </h4>
            <p className="text-sm text-gray-300 mb-3">
              Congratulations! Your DEX website is fully built and ready to use.
              Your users can access it at:
            </p>
            <a
              href={
                dexData.customDomain
                  ? `https://${dexData.customDomain}`
                  : deploymentUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded text-primary-light transition-colors"
            >
              <span className="break-all">
                {dexData.customDomain ? dexData.customDomain : deploymentUrl}
              </span>
              <div className="i-mdi:open-in-new h-4 w-4"></div>
            </a>

            {dexData.customDomain && (
              <div className="mt-2 text-xs text-gray-400 flex items-start gap-1">
                <div className="i-mdi:information-outline h-3.5 w-3.5 mt-0.5 flex-shrink-0"></div>
                <span>
                  Your DEX is using a custom domain. The standard deployment URL
                  will no longer work correctly as the build is now optimized
                  for your custom domain.
                </span>
              </div>
            )}

            {dexData.customDomain && (
              <div className="mt-2 text-xs text-warning flex items-start gap-1">
                <div className="i-mdi:alert-circle-outline h-3.5 w-3.5 mt-0.5 flex-shrink-0"></div>
                <span>
                  Note: After changing any custom domain settings, you must wait
                  for a deployment to complete (check "Updates & Deployment
                  Status" below) for domain changes to take effect.
                </span>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-light/10">
              <h5 className="text-sm font-bold mb-2 flex items-center">
                <div className="i-mdi:information-outline text-primary-light mr-2 h-4 w-4"></div>
                Making Changes to Your DEX
              </h5>
              <p className="text-xs text-gray-300 mb-2">
                When you update any information above (like your broker name,
                logos, or social links):
              </p>
              <ul className="text-xs text-gray-300 list-disc ml-5 space-y-1">
                <li>Your changes are first saved to our system</li>
                <li>
                  An automatic update process (workflow) runs to rebuild your
                  DEX
                </li>
                <li>
                  Once complete, your changes will appear live on your DEX
                  website
                </li>
                <li>This process typically takes 2-5 minutes</li>
              </ul>
              <p className="text-xs text-gray-400 mt-2 italic">
                You can track the progress of your updates in the "Deployment
                Progress" section above
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <h4 className="text-base font-bold mb-2 flex items-center">
              <div className="i-mdi:progress-clock text-warning mr-2 h-5 w-5"></div>
              Step 2: Building Your DEX Website
            </h4>
            <p className="text-sm text-gray-300 mb-2">
              We're currently building your DEX website from the source code.
              This process usually takes 2-5 minutes to complete.
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Once complete, you'll see a link to your live DEX here.
            </p>

            <div className="mt-3 pt-3 border-t border-light/10">
              <h5 className="text-sm font-bold mb-2 flex items-center">
                <div className="i-mdi:information-outline text-warning mr-2 h-4 w-4"></div>
                About Future Updates
              </h5>
              <p className="text-xs text-gray-300">
                Whenever you make changes to your DEX (updating logos, social
                links, etc.), this same build process will run again. Your
                changes will be live after the process completes, which
                typically takes 2-5 minutes.
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-light/10">
          <h4 className="text-base font-bold mb-3">
            Updates & Deployment Status
          </h4>
          <p className="text-xs text-gray-400 mb-3">
            This shows the current status of your DEX updates. When the latest
            run shows "completed", your changes are live on your DEX website:
          </p>
          <WorkflowStatus
            dexId={dexData.id}
            workflowName="Deploy to GitHub Pages"
            onSuccessfulDeployment={handleSuccessfulDeployment}
          />
        </div>
      </Card>
    );
  }

  if (dexData.id && !dexData.repoUrl) {
    return (
      <Card variant="error" className="mb-6" id="dex-creation-status">
        <p className="text-sm text-gray-300 mb-2">
          <span className="text-red-300 font-medium">⚠️ Note:</span> Your DEX
          configuration was saved, but we couldn't create your repository.
        </p>
        <p className="text-sm text-gray-300 mb-4">
          You can retry the repository creation now.
        </p>
        <Button
          onClick={handleRetryForking}
          disabled={isForking}
          variant="danger"
          size="sm"
          isLoading={isForking}
          loadingText="Retrying..."
        >
          Retry Repository Creation
        </Button>
      </Card>
    );
  }

  return null;
}
