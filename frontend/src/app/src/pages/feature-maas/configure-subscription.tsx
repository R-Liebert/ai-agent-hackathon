import React, { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/MaaS/global/PageHeader";
import { SubscriptionType } from "../../components/MaaS/subscription/SubscriptionTypeGrId";
import { useSubscriptionsStore } from "../../stores/maasStore";
import { notificationsService } from "../../services/notificationsService";
import { getValidationSchema } from "../../utils/maas/subscriptionValidationSchema";
import type {
  SubscriptionEntity,
  Model,
  ModelKey,
  ApplicationReference,
  AdGroupReference,
  GuardrailKey,
} from "../../types/maasTypes";
import SubscriptionConfigurationForm from "../../components/MaaS/subscription/ConfigurationDetailsForm";
import CollapsibleSection from "../../components/MaaS/global/CollapsibleSection";
import { useNavigate, useParams } from "react-router-dom";
import { useApplicationsAndAdGroups } from "../../hooks/useApplicationsAndAdGroups";
import ModelManagement from "../../components/MaaS/subscription/ConfigurationModelManagement";
import AdminActionDialog from "../../components/MaaS/admin/AdminActionDialog";
import ActionsPanel from "../../components/MaaS/subscription/ConfigurationActionsPanel";
import { TbArrowBarToDown } from "react-icons/tb";
import Tooltip from "../../components/Global/Tooltip";

// Local model toggle state: key => enabled?
type ToggleMap = Partial<Record<ModelKey, boolean>>;

// Local guardrail toggle state for a single model: guardrailKey => enforced?
type GuardrailToggleMap = Partial<Record<GuardrailKey, boolean>>;

// Local guardrail toggle state for all models: modelKey => GuardrailToggleMap
type AllGuardrailToggles = Partial<Record<ModelKey, GuardrailToggleMap>>;

interface ConfigureFormValues {
  subscriptionName: string;
  applicationReference: ApplicationReference | string | null; // NORMAL: object, SANDBOX: string
  subscriptionPurpose: string;
  environment: string;
  department: string;
  adGroupReference: AdGroupReference | null;
  expirationDate: number | null;
}

export default function ConfigureSubscriptionPage() {
  const { t } = useTranslation("subscriptions");
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  const navigate = useNavigate();

  // Store selectors
  const getByIdStore = useSubscriptionsStore((s) => s.getById);
  const subscriptions = useSubscriptionsStore((s) => s.subscriptions);
  const updateDetails = useSubscriptionsStore(
    (s) => s.updateSubscriptionDetails,
  );
  const modelsCatalog = useSubscriptionsStore((s) => s.modelsCatalog);
  const fetchModels = useSubscriptionsStore((s) => s.fetchModels);
  const updateSubscriptionModels = useSubscriptionsStore(
    (s) => s.updateSubscriptionModels,
  );
  const updateSubscriptionExpiration = useSubscriptionsStore(
    (s) => s.updateSubscriptionExpiration,
  );

  const blockSubscription = useSubscriptionsStore((s) => s.blockSubscription);
  const deleteSubscription = useSubscriptionsStore((s) => s.deleteSubscription);

  const setModelGuardrailEnabledForSubscription = useSubscriptionsStore(
    (s) => s.setModelGuardrailEnabledForSubscription,
  );

  const reactivateSubscription = useSubscriptionsStore(
    (s) => s.reactivateSubscription,
  );

  const updateSubscriptionGuardrails = useSubscriptionsStore(
    (s) => s.updateSubscriptionGuardrails,
  );

  const [entity, setEntity] = useState<SubscriptionEntity | null>(null);
  const [subscriptionType, setSubscriptionType] =
    useState<SubscriptionType>("SANDBOX");
  const [loading, setLoading] = useState(true);

  const {
    applications,
    adGroups,
    isLoadingApplications,
    isLoadingAdGroups,
    isLoadingMoreApplications,
    isLoadingMoreAdGroups,
    applicationsHasMore,
    adGroupsHasMore,
    searchApplications,
    searchAdGroups,
    loadMoreApplications,
    loadMoreAdGroups,
  } = useApplicationsAndAdGroups();

  // LOCAL‑ONLY model toggles state (committed on Save)
  const [modelToggles, setModelToggles] = useState<ToggleMap>({});
  const [initialModelToggles, setInitialModelToggles] = useState<ToggleMap>({});
  const [modelsTouched, setModelsTouched] = useState(false);

  // Admin action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionModalAction, setActionModalAction] = useState<
    "deactivate" | "delete" | "reactivate" | null
  >(null);
  const [actionModalSubscription, setActionModalSubscription] =
    useState<SubscriptionEntity | null>(null);

  // Guardrails: which model is selected in the Guardrails UI
  const [selectedGuardrailModelKey, setSelectedGuardrailModelKey] =
    useState<ModelKey | null>(null);

  // Guardrails: local toggles for the currently selected model
  const [guardrailToggles, setGuardrailToggles] = useState<GuardrailToggleMap>(
    {},
  );

  // Guardrails: local toggles for all models (used for diff on Save)
  const [allGuardrailToggles, setAllGuardrailToggles] =
    useState<AllGuardrailToggles>({});

  // Models initialized flag (so we only compute initial toggles once per entity/catalog)
  const [modelsInitialized, setModelsInitialized] = useState(false);

  // Flag to indicate there are unsaved guardrail changes
  const [guardrailsDirty, setGuardrailsDirty] = useState(false);

  // Load subscription entity with hydration awareness
  useEffect(() => {
    let unsub: (() => void) | undefined;
    async function load() {
      if (!subscriptionId) {
        setLoading(false);
        return;
      }

      const found = getByIdStore(subscriptionId);
      if (found) {
        setEntity(found);
        setSubscriptionType(found.type as SubscriptionType);
        setLoading(false);
        return;
      }

      // Handle zustand persist hydration case
      const api: any = (useSubscriptionsStore as any).persist;
      if (api?.hasHydrated?.()) {
        setLoading(false);
        return;
      }

      unsub = api?.onFinishHydration?.(() => {
        const retry = useSubscriptionsStore.getState().getById(subscriptionId);
        if (retry) {
          setEntity(retry);
          setSubscriptionType(retry.type as SubscriptionType);
        } else {
          notificationsService.error(
            t("configureSubscription.notifications.notFound", {
              defaultValue: "Subscription not found.",
            }) as string,
          );
        }
        setLoading(false);
      });

      api?.rehydrate?.();
    }

    load();

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [subscriptionId, getByIdStore, t]);

  // Ensure models catalog is loaded
  useEffect(() => {
    if (!modelsCatalog || Object.keys(modelsCatalog).length === 0) {
      fetchModels().catch((err) => console.error("fetchModels failed", err));
    }
  }, [modelsCatalog, fetchModels]);

  // Keep entity in sync with store (cross‑tab updates)
  useEffect(() => {
    if (!entity) return;
    const latest = getByIdStore(entity.id);
    if (latest) {
      setEntity(latest);
      setSubscriptionType(latest.type as SubscriptionType);
    }
  }, [subscriptions, entity, getByIdStore]);

  // Build validation schema for the Basic Information form
  const validationSchema = useMemo(() => {
    try {
      return getValidationSchema(subscriptionType, t);
    } catch (err) {
      console.error("getValidationSchema failed:", err);
      return undefined;
    }
  }, [subscriptionType, t]);

  // Available models from catalog (ACTIVE only, sorted)
  const availableModels: Model[] = useMemo(() => {
    const all = Object.values(modelsCatalog ?? {});
    const active = all.filter((m) => m.status === "ACTIVE");

    active.sort((a, b) => {
      const aHasName = !!(a.name && a.name.trim().length > 0);
      const bHasName = !!(b.name && b.name.trim().length > 0);
      if (aHasName !== bHasName) {
        return aHasName ? -1 : 1;
      }

      const ap = (a.provider || "").toLowerCase();
      const bp = (b.provider || "").toLowerCase();
      if (ap !== bp) {
        return ap.localeCompare(bp);
      }

      const aLabel = (a.name || a.key || "").toLowerCase();
      const bLabel = (b.name || b.key || "").toLowerCase();
      return aLabel.localeCompare(bLabel);
    });

    return active;
  }, [modelsCatalog]);

  // Initialize model toggles based on the entity state + catalog
  useEffect(() => {
    if (!entity) return;
    if (modelsInitialized) return;

    const current: ToggleMap = {};
    const enabledKeys = new Set(
      (entity.models ?? []).filter((m) => m.enabled).map((m) => m.key),
    );

    availableModels.forEach((m) => {
      current[m.key as ModelKey] = enabledKeys.has(m.key);
    });

    setModelToggles(current);
    setInitialModelToggles(current);
    setModelsInitialized(true);
  }, [entity, availableModels, modelsInitialized]);

  // Compute diff for model toggles (initial vs current)
  const diffToggles = (
    prev: ToggleMap,
    next: ToggleMap,
  ): Partial<Record<ModelKey, boolean>> => {
    const keys = new Set<ModelKey>([
      ...(Object.keys(prev) as ModelKey[]),
      ...(Object.keys(next) as ModelKey[]),
    ]);
    const patch: Partial<Record<ModelKey, boolean>> = {};
    keys.forEach((k) => {
      const a = !!prev[k];
      const b = !!next[k];
      if (a !== b) patch[k] = b;
    });
    return patch;
  };

  // Compute diff for guardrail toggles (entity vs local AllGuardrailToggles)
  const diffGuardrails = (
    sub: SubscriptionEntity,
    all: AllGuardrailToggles,
  ): { modelKey: ModelKey; guardrailKey: GuardrailKey; next: boolean }[] => {
    const diffs: {
      modelKey: ModelKey;
      guardrailKey: GuardrailKey;
      next: boolean;
    }[] = [];

    const modelsByKey = new Map(
      (sub.models ?? []).map((m) => [m.key as ModelKey, m]),
    );

    for (const [modelKeyStr, guardrails] of Object.entries(all)) {
      const modelKey = modelKeyStr as ModelKey;
      const model = modelsByKey.get(modelKey);
      if (!model || !model.guardrails) continue;

      const originalByKey = new Map(
        model.guardrails.map((g) => [g.key as GuardrailKey, g]),
      );

      for (const [guardrailKeyStr, nextValue] of Object.entries(
        guardrails ?? {},
      )) {
        const guardrailKey = guardrailKeyStr as GuardrailKey;
        const original = originalByKey.get(guardrailKey);
        const prev = original ? !!original.enforced : false;
        const next = !!nextValue;

        if (prev !== next) {
          diffs.push({ modelKey, guardrailKey, next });
        }
      }
    }

    return diffs;
  };

  const selectedCount = useMemo(
    () => availableModels.filter((m) => modelToggles[m.key as ModelKey]).length,
    [availableModels, modelToggles],
  );
  const modelsValid = selectedCount > 0;

  const togglesDirty = useMemo(() => {
    const patch = diffToggles(initialModelToggles, modelToggles);
    return Object.keys(patch).length > 0;
  }, [initialModelToggles, modelToggles]);

  // Initial form values based on entity
  const initialValues: ConfigureFormValues = useMemo(() => {
    if (!entity) {
      return {
        subscriptionName: "",
        applicationReference: "",
        subscriptionPurpose: "",
        environment: "",
        department: "",
        adGroupReference: null,
        expirationDate: null,
      };
    }

    const isNormal = entity.type === "NORMAL";

    let expiryMs: number | null = null;
    if (entity.expirationDate != null) {
      if (typeof entity.expirationDate === "number") {
        expiryMs = entity.expirationDate;
      } else if (typeof entity.expirationDate === "string") {
        const ms = Date.parse(entity.expirationDate);
        expiryMs = Number.isNaN(ms) ? null : ms;
      }
    }

    return {
      subscriptionName: entity.name || "",
      applicationReference: isNormal
        ? (entity.applicationReference ?? null)
        : (entity.applicationRefFreeText ?? ""),
      subscriptionPurpose: entity.subscriptionPurpose || "",
      environment: isNormal ? entity.environment || "" : "",
      department: entity.department || "",
      adGroupReference: isNormal ? (entity.adGroupReference ?? null) : null,
      expirationDate: expiryMs,
    };
  }, [entity]);

  const formik = useFormik<ConfigureFormValues>({
    enableReinitialize: true,
    validateOnMount: false,
    validateOnBlur: true,
    validateOnChange: true,
    initialValues,
    validationSchema,
    // MAIN SUBMIT HANDLER – all changes (basic info, models, guardrails) are persisted here
    onSubmit: async (values, helpers) => {
      const { setSubmitting, setStatus } = helpers;
      setSubmitting(true);
      try {
        if (!entity) {
          notificationsService.error(
            t("configureSubscription.notifications.notFound", {
              defaultValue: "Subscription not found.",
            }) as string,
          );
          setSubmitting(false);
          return;
        }

        const isNormal = subscriptionType === "NORMAL";

        // Normalize basic info fields
        const normalizedName = (values.subscriptionName || "").trim();
        const normalizedPurpose = (values.subscriptionPurpose || "").trim();
        const normalizedDept = (values.department || "").trim();

        const normalizedEnvironment = isNormal
          ? (values.environment as "PROD" | "NON_PROD") || "NON_PROD"
          : undefined;

        const normalizedApplicationReference = isNormal
          ? (values.applicationReference as ApplicationReference) || undefined
          : undefined;

        const normalizedApplicationRefFreeText = !isNormal
          ? (values.applicationReference as string).trim()
          : undefined;

        const normalizedAdGroupReference = isNormal
          ? values.adGroupReference || undefined
          : undefined;

        const input = {
          type: subscriptionType,
          subscriptionName: normalizedName,
          subscriptionPurpose: normalizedPurpose,
          department: normalizedDept,
          environment: normalizedEnvironment,
          applicationReference: normalizedApplicationReference,
          applicationRefFreeText: normalizedApplicationRefFreeText,
          adGroupReference: normalizedAdGroupReference,
        };

        let saved = entity;

        // 1) Save basic info if the form is dirty
        if (formik.dirty) {
          saved = await updateDetails(entity.id, input);
        }

        // 2) Handle expiry date changes
        const prevExpiryMs =
          entity.expirationDate != null
            ? typeof entity.expirationDate === "number"
              ? entity.expirationDate
              : (() => {
                  const ms = Date.parse(entity.expirationDate as any);
                  return Number.isNaN(ms) ? undefined : ms;
                })()
            : undefined;

        const nextExpiryMs =
          values.expirationDate != null ? values.expirationDate : undefined;

        if (nextExpiryMs !== undefined && nextExpiryMs !== prevExpiryMs) {
          await updateSubscriptionExpiration(saved.id, nextExpiryMs);
        }

        // 3) Handle model enable/disable changes (LOCAL ONLY until here)
        const patch = diffToggles(initialModelToggles, modelToggles);
        if (Object.keys(patch).length > 0) {
          await updateSubscriptionModels(saved.id, patch);
        }
        // 4) Handle GUARDRAIL CHANGES – this is committed ONLY on Save
        if (guardrailsDirty) {
          const guardrailDiffs = diffGuardrails(saved, allGuardrailToggles);

          if (guardrailDiffs.length > 0) {
            // Persist all changed guardrails in ONE store call
            await updateSubscriptionGuardrails(
              saved.id,
              guardrailDiffs.map((diff) => ({
                modelKey: diff.modelKey,
                guardrailKey: diff.guardrailKey,
                enforced: diff.next, // map 'next' to 'enforced'
              })),
            );
          }
        }

        setStatus({ saved: true });
        notificationsService.success(
          t("configureSubscription.notifications.saved", {
            defaultValue: "Subscription updated.",
          }) as string,
        );

        // Navigate back to the subscription details page
        navigate(`/maas/${saved.id}`);
      } catch (e) {
        helpers.setStatus({ submitError: true });
        notificationsService.error(
          t("configureSubscription.notifications.errorMessage", {
            defaultValue: "Something went wrong while saving changes.",
          }) as string,
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (loading) return null;
  if (!entity) return null;

  // Prevent Save when:
  //  - form is submitting
  //  - form is invalid
  //  - no models selected
  //  - nothing changed (form, models, or guardrails)
  const preventSubmit =
    formik.isSubmitting ||
    !formik.isValid ||
    !modelsValid ||
    !(formik.dirty || togglesDirty || guardrailsDirty);

  // Toggle model locally (no immediate store update)
  const handleToggleModel = (modelKey: ModelKey) => {
    setModelsTouched(true);

    setModelToggles((prev) => {
      const currentlyOn = !!prev[modelKey];

      if (currentlyOn) {
        // How many are on right now?
        const activeCount = availableModels.filter(
          (m) => prev[m.key as ModelKey],
        ).length;

        // If this is the last one, block the toggle
        if (activeCount <= 1) {
          notificationsService.error(
            t(
              "subscription-configuration.validationMessages.noModelSelected",
              "At least one model must remain active.",
            ) as string,
          );
          return prev;
        }
      }

      return {
        ...prev,
        [modelKey]: !currentlyOn,
      };
    });
  };

  const handleSelectedModelChange = (modelKey: ModelKey | null) => {
    setSelectedGuardrailModelKey(modelKey);

    if (!modelKey) {
      setGuardrailToggles({});
      return;
    }

    // 1) Use existing local state if present
    const existing = allGuardrailToggles[modelKey];
    if (existing) {
      setGuardrailToggles(existing);
      return;
    }

    // 2) Try subscription entity (already saved models)
    let model = (entity.models ?? []).find((m) => m.key === modelKey) ?? null;

    // 3) If not in subscription yet (newly enabled), use catalog model
    if (!model) {
      const fromCatalog = modelsCatalog[modelKey];
      if (fromCatalog) {
        model = {
          ...fromCatalog,
          enabled: true,
        } as any;
      }
    }

    if (!model || !model.guardrails) {
      setGuardrailToggles({});
      setAllGuardrailToggles((prev) => ({
        ...prev,
        [modelKey]: {},
      }));
      return;
    }

    const next: GuardrailToggleMap = {};
    for (const g of model.guardrails) {
      next[g.key as GuardrailKey] = g.enforced;
    }

    setGuardrailToggles(next);
    setAllGuardrailToggles((prev) => ({
      ...prev,
      [modelKey]: next,
    }));
  };

  // TOGGLE GUARDRAIL LOCALLY
  const handleToggleGuardrail = (guardrailKey: GuardrailKey) => {
    if (!selectedGuardrailModelKey) return;

    const current = guardrailToggles[guardrailKey] ?? false;
    const next = !current;

    setGuardrailToggles((prev) => ({
      ...prev,
      [guardrailKey]: next,
    }));

    setAllGuardrailToggles((prev) => ({
      ...prev,
      [selectedGuardrailModelKey]: {
        ...(prev[selectedGuardrailModelKey] ?? {}),
        [guardrailKey]: next,
      },
    }));

    setGuardrailsDirty(true);
  };

  // Admin action modal helpers
  const openAdminActionModal = (
    action: "deactivate" | "delete" | "reactivate",
    subscription: SubscriptionEntity,
  ) => {
    setActionModalAction(action);
    setActionModalSubscription(subscription);
    setActionModalOpen(true);
  };

  const closeAdminActionModal = () => {
    setActionModalOpen(false);
    setActionModalAction(null);
    setActionModalSubscription(null);
  };

  const onConfirmAdminAction = async (params: {
    justification: string;
    expiryTs?: number;
    clear?: boolean;
  }) => {
    const { justification } = params;

    if (!actionModalAction || !actionModalSubscription) return;

    try {
      if (actionModalAction === "deactivate") {
        await blockSubscription(actionModalSubscription.id, justification);
        notificationsService.success(
          t("configureSubscription.notifications.deactivated", {
            defaultValue: "Subscription successfully deactivated.",
          }) as string,
        );
        // Redirect to subscription detail page
        navigate(`/maas/${actionModalSubscription.id}`);
      } else if (actionModalAction === "reactivate") {
        await reactivateSubscription(actionModalSubscription.id, {
          justification,
        });
        notificationsService.success(
          t("configureSubscription.notifications.reactivated", {
            defaultValue: "Subscription successfully reactivated.",
          }) as string,
        );
        // Redirect to subscription detail page
        navigate(`/maas/${actionModalSubscription.id}`);
      } else if (actionModalAction === "delete") {
        await deleteSubscription(actionModalSubscription.id, justification);
        notificationsService.success(
          t("configureSubscription.notifications.deleted", {
            defaultValue: "Subscription successfully deleted.",
          }) as string,
        );
        // Redirect to the main subscriptions list
        navigate("/maas");
      }
    } catch (error) {
      notificationsService.error(
        t("configureSubscription.notifications.error", {
          defaultValue: "Something went wrong. Please try again.",
        }) as string,
      );
    } finally {
      closeAdminActionModal();
    }
  };

  console.log("Render ConfigureSubscriptionPage", { availableModels });

  const handleSaveClick = () => {
    // 0) Guard: no entity (shouldn’t happen in normal flow)
    if (!entity) {
      notificationsService.error(
        t("configureSubscription.notifications.notFound", {
          defaultValue: "Subscription not found.",
        }) as string,
      );
      return;
    }

    // 1) No active models available at all
    if (availableModels.length === 0) {
      notificationsService.error(
        t("configureSubscription.validation.noActiveModels", {
          defaultValue:
            "No active models are available for this subscription. Please contact an administrator.",
        }) as string,
      );
      return;
    }

    // 2) No model selected
    if (!modelsValid) {
      // Make the error visible in the Models section
      setModelsTouched(true);
      notificationsService.error(
        t(
          "subscription-configuration.validationMessages.noModelSelected",
          "Select at least one model before saving.",
        ) as string,
      );
      return;
    }

    // 3) Form invalid – force-show field errors
    if (!formik.isValid) {
      // Validate everything and mark all fields touched so inline errors show
      formik.validateForm();
      formik.setTouched(
        Object.keys(formik.values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as Record<string, boolean>,
        ),
      );
      notificationsService.error(
        t("configureSubscription.validation.fixFormFields", {
          defaultValue: "Please fix the highlighted fields before saving.",
        }) as string,
      );
      return;
    }

    // 4) Nothing changed
    if (!(formik.dirty || togglesDirty || guardrailsDirty)) {
      notificationsService.info(
        t("configureSubscription.validation.noChanges", {
          defaultValue: "There are no changes to save.",
        }) as string,
      );
      return;
    }

    // 5) All good – submit
    formik.submitForm();
  };

  return (
    <div
      aria-labelledby="configure-subscription-page"
      className="w-full flex flex-col gap-8 pb-20"
    >
      <Helmet>
        <title>
          {t("configureSubscription.title", {
            defaultValue: "Configure Subscription",
          })}{" "}
          - MaaS
        </title>
        <meta
          name="description"
          content={
            (t("configureSubscription.subtitleWithId", {
              id: subscriptionId,
              defaultValue: `Edit subscription settings · ${subscriptionId}`,
            }) as string) || ""
          }
        />
      </Helmet>
      <button
        className="flex cursor-pointer outline-none height-auto width-auto fixed top-2 right-12 p-2 rounded-lg z-[999999] active:outline-none active:ring-6 active:ring-opacity-10 active:ring-transparent hover:bg-gray-600 hover:text-superwhite transition-all duration-300 ease-out"
        aria-label={t("workspaces:common:saveChangesButton")}
        onClick={handleSaveClick}
      >
        <div className="relative group">
          <TbArrowBarToDown
            size={24}
            strokeWidth={1.4}
            className="text-superwhite"
          />
          <Tooltip
            text="workspaces:common:saveChangesButton"
            position="-right-3 -bottom-10"
          />
        </div>
      </button>

      <PageHeader
        title={
          (t("configureSubscription.title", {
            defaultValue: "Configure Subscription",
          }) as string) || "Configure Subscription"
        }
        subtitle={`Subscription: ${subscriptionId}`}
      >
        <button
          type="button"
          data-testid="configure-subscription-save-button"
          className="ml-auto mr-0  mt-auto -mb-4 text-sm font-body px-4 py-2 flex bg-white-100 hover:bg-red-600 hover:text-white-100 text-gray-700 font-semibold transition-color duration-300 ease-out rounded-full w-auto text-center place-content-center"
          onClick={handleSaveClick}
          disabled={formik.isSubmitting}
          aria-label={
            (t("configureSubscription.cta.save", {
              defaultValue: "Save changes",
            }) as string) || "Save changes"
          }
        >
          {t("configureSubscription.cta.save", {
            defaultValue: "Save changes",
          })}
        </button>
      </PageHeader>

      {/* Basic Information */}
      <CollapsibleSection title="Basic Information" defaultOpen={true}>
        <SubscriptionConfigurationForm
          formik={formik}
          subscriptionType={subscriptionType}
          onSubscriptionTypeChange={setSubscriptionType}
          applications={applications}
          adGroups={adGroups}
          onSearchApplications={searchApplications}
          onSearchAdGroups={searchAdGroups}
          isLoadingApplications={isLoadingApplications}
          isLoadingAdGroups={isLoadingAdGroups}
          applicationsHasMore={applicationsHasMore}
          adGroupsHasMore={adGroupsHasMore}
          onLoadMoreApplications={loadMoreApplications}
          onLoadMoreAdGroups={loadMoreAdGroups}
        />
      </CollapsibleSection>

      {/* Models Management */}
      <CollapsibleSection
        title="Models Management"
        isModels={true}
        defaultOpen={false}
      >
        <ModelManagement
          availableModels={availableModels}
          modelToggles={modelToggles}
          modelsValid={modelsValid}
          modelsTouched={modelsTouched}
          onToggleModel={handleToggleModel}
          selectedModelKey={selectedGuardrailModelKey}
          onSelectedModelChange={handleSelectedModelChange}
          guardrailToggles={guardrailToggles}
          onToggleGuardrail={handleToggleGuardrail}
        />
      </CollapsibleSection>

      {/* Actions */}
      <CollapsibleSection title="Actions" defaultOpen={false}>
        <ActionsPanel entity={entity!} onAction={openAdminActionModal} />
      </CollapsibleSection>
      {actionModalOpen && actionModalAction && actionModalSubscription && (
        <AdminActionDialog
          open={actionModalOpen}
          onClose={closeAdminActionModal}
          actionType={actionModalAction}
          subscriptionName={actionModalSubscription.name}
          subscriptionConsumer={actionModalSubscription.user}
          onConfirm={onConfirmAdminAction}
        />
      )}
    </div>
  );
}
