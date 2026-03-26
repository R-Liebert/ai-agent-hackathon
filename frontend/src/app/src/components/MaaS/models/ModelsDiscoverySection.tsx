import ModelCard from "../../MaaS/global/ModelCard";
import EmptyStateNotice from "../../MaaS/global/EmptyStateNotice";

interface ModelsDiscoverySectionProps {
  models: Array<{
    key: string;
    name: string;
    description?: string;
    provider: string;
    capabilities?: string[];
    status?: string;
  }>;
  emptyText: string;
}

export default function ModelsDiscoverySection({
  models,
  emptyText,
}: ModelsDiscoverySectionProps) {
  return (
    <section
      id="tab-panel-models"
      aria-labelledby="models-heading"
      className="flex flex-col gap-4 mt-6 mb-16"
    >
      {models.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {models.map((model) => (
            <ModelCard
              key={model.key}
              model={model as any}
              variant="discovery"
            />
          ))}
        </div>
      ) : (
        <EmptyStateNotice title={emptyText} />
      )}
    </section>
  );
}
