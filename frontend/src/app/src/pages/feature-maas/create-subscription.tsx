import React, { useState, useMemo, useEffect } from "react";
import { useFormik } from "formik";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useSubscriptionsStore } from "../../stores/maasStore";
import { getValidationSchema } from "../../utils/maas/subscriptionValidationSchema";
import CreateSubscriptionForm from "../../components/MaaS/subscription/CreateSubscriptionForm";
import SubscriptionTypeCards, {
  SubscriptionType,
} from "../../components/MaaS/subscription/SubscriptionTypeGrId";
import { TbExclamationCircle } from "react-icons/tb";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { notificationsService } from "../../services/notificationsService";
import PageHeader from "../../components/MaaS/global/PageHeader";
import useSidebarStore from "../../stores/navigationStore";
import { useUserStore } from "../../stores/userStore";
import { useMsal } from "@azure/msal-react";
import type {
  SubscriptionEntity,
  ApplicationReference,
  AdGroupReference,
} from "../../types/maasTypes";
import { useApplicationsAndAdGroups } from "../../hooks/useApplicationsAndAdGroups";

type Env = "PROD" | "NON_PROD";
type EnvString = Env | "";

interface CreateFormValues {
  subscriptionName: string;
  subscriptionPurpose: string;
  environment: EnvString;
  department: string;
  // NORMAL → ApplicationReference | null
  // SANDBOX → string (free text)
  applicationReference: ApplicationReference | string | null;
  // NORMAL only
  adGroupReference: AdGroupReference | null;
}

export default function CreateSubscriptionPage() {
  const { t } = useTranslation("subscriptions");

  const [subscriptionType, setSubscriptionType] =
    useState<SubscriptionType>("SANDBOX");

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

  const createNormal = useSubscriptionsStore((state) => state.createNormal);
  const createSandbox = useSubscriptionsStore((state) => state.createSandbox);

  const { accounts } = useMsal();
  const ensureUserHydrated = useUserStore((state) => state.ensureHydrated);

  useEffect(() => {
    ensureUserHydrated(accounts[0]);
  }, [accounts, ensureUserHydrated]);

  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebarStore();

  const validationSchema = useMemo(() => {
    try {
      return getValidationSchema(subscriptionType, t);
    } catch (err) {
      console.error("getValidationSchema failed:", err);
      return undefined;
    }
  }, [subscriptionType, t]);

  const touchAllFields = (
    setFieldTouched: (
      field: string,
      touched?: boolean,
      shouldValidate?: boolean,
    ) => void,
    values: Record<string, unknown>,
  ) => {
    Object.keys(values).forEach((key) => setFieldTouched(key, true, true));
  };

  const buildErrorSummary = (errors: Record<string, any>) => {
    const keys = Object.keys(errors);
    if (keys.length === 0) return null;
    const topErrors = keys.slice(0, 3).map((k) => errors[k]);
    return topErrors.join(" • ");
  };

  const formik = useFormik<CreateFormValues>({
    enableReinitialize: false,
    validateOnMount: false,
    validateOnBlur: true,
    validateOnChange: true,
    initialValues: {
      subscriptionName: "",
      subscriptionPurpose: "",
      environment: "" as EnvString,
      department: "",
      applicationReference: null,
      adGroupReference: null,
    },
    validationSchema,
    onSubmit: async (values, helpers) => {
      const { setSubmitting, setStatus } = helpers;
      setSubmitting(true);

      try {
        const currentErrors = await formik.validateForm();
        if (Object.keys(currentErrors).length > 0) {
          touchAllFields(formik.setFieldTouched, formik.values as any);
          notificationsService.error(
            buildErrorSummary(currentErrors) ||
              (t("validation.genericFixErrors", {
                defaultValue: "Please fix the highlighted fields.",
              }) as string),
          );
          setSubmitting(false);
          return;
        }

        const idFromRouteOrNew = subscriptionId || uuidv4();
        const isNormal = subscriptionType === "NORMAL";
        const env =
          values.environment === "" ? undefined : (values.environment as Env);

        let created: SubscriptionEntity;
        if (isNormal) {
          const appRef =
            values.applicationReference as ApplicationReference | null;
          const adGroupRef = values.adGroupReference;

          if (!appRef || !adGroupRef) {
            throw new Error(
              "Application and AD group references are required for NORMAL subscriptions.",
            );
          }

          created = await createNormal({
            subscriptionName: values.subscriptionName.trim(),
            department: values.department,
            subscriptionPurpose: values.subscriptionPurpose,
            environment: env as Env,
            applicationReference: appRef,
            adGroupReference: adGroupRef,
          });
        } else {
          const freeText = (values.applicationReference as string) || "";
          created = await createSandbox(
            {
              subscriptionName: (values.subscriptionName || "").trim(),
              subscriptionPurpose: (values.subscriptionPurpose || "").trim(),
              department: (values.department || "").trim(),
              applicationRefFreeText: freeText.trim(),
            },
            idFromRouteOrNew,
          );
        }

        notificationsService.success(
          t("createSubscription.notifications.successMessage") as string,
        );
        navigate(`/maas/${created.id}`);
      } catch (err: any) {
        console.error("Create subscription failed:", err);
        setStatus({ submitError: true });
        notificationsService.error(
          t("createSubscription.notifications.errorMessage", {
            defaultValue:
              "Something went wrong while creating the subscription.",
          }) as string,
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <section aria-labelledby="create-subscription-page" className="w-full">
      <Helmet>
        <title>{t("createSubscription.title")} - MaaS</title>
        <meta
          name="description"
          content={t("createSubscription.subscriptionInformation") as string}
        />
      </Helmet>

      <PageHeader
        title={t("createSubscription.title")}
        subtitle={t("createSubscription.subtitle")}
      ></PageHeader>

      <div
        className={`w-full bg-transparent sm:bg-gray-700 border-0 sm:border-2 sm:border-gray-500 rounded-3xl grid font-body p-0 sm:p-8 gap-6 ${
          isSidebarOpen
            ? "grid-cols-1 xl:gap-16 xxl:gap-24"
            : "md:gap-12 lg:gap-20 xl:gap-22 md:grid-cols-[0.92fr_1fr] lg:grid-cols-[0.724fr_1fr]"
        } xl:grid-cols-[0.724fr_1fr] pb-8 sm:pb-14 mb-10 sm:mb-16`}
      >
        <div
          className={`flex flex-col w-full ${
            isSidebarOpen
              ? "order-1 xl:col-start-1 xl:row-start-1 xl:row-span-2"
              : "md:col-start-1 md:row-start-1 md:row-span-2 order-1"
          }`}
        >
          <SubscriptionTypeCards
            value={subscriptionType}
            onChange={(next) => {
              setSubscriptionType(next);
              formik.setFieldTouched("applicationReference", false);
              formik.setFieldTouched("adGroupReference", false);
              formik.setFieldTouched("environment", false);
            }}
          />
        </div>

        <div
          className={`w-full ${
            isSidebarOpen
              ? "order-2 xl:col-start-2 xl:row-start-1 xl:row-span-2"
              : "md:col-start-2 md:row-start-1 md:row-span-2 order-2"
          } min-h-0`}
        >
          <CreateSubscriptionForm
            key={`${subscriptionType}-${subscriptionId ?? "new"}`}
            formik={formik}
            subscriptionType={subscriptionType}
            t={t}
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
        </div>

        <div
          className={`w-full grid grid-cols-[auto_1fr] gap-x-3 items-start border-2 border-gray-500 rounded-xl py-3 px-4 ${
            isSidebarOpen
              ? "order-3 mt-6  xl:col-start-1 xl:row-start-2 xl:self-end"
              : "md:py-3 md:px-4 order-last md:col-start-1 md:row-start-2 md:self-end mt-6 sm:mt-0"
          }`}
        >
          <TbExclamationCircle
            size={26}
            strokeWidth={1.4}
            className="text-[#E7BB61] mt-[2px] shrink-0"
          />
          <p className="text-md text-white-100 leading-7 md:leading-6 min-w-0 break-words">
            {t("createSubscription.subscriptionInformation")}
          </p>
        </div>
      </div>
    </section>
  );
}
