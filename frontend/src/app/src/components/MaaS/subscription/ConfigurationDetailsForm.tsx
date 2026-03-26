import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { FormikProps } from "formik";
import { getIn } from "formik";

import SubscriptionTypeCards, {
  SubscriptionType,
} from "./SubscriptionTypeGrId";
import FormLabel from "../../Global/FormLabel";
import FormTextarea from "../../Global/FormTextarea";
import FormSelect from "../../Global/FormSelect";
import ExpiryDateUpdateSection from "../global/ExpiryDateUpdateSection";
import dayjs from "dayjs";

import type {
  ApplicationReference,
  AdGroupReference,
} from "../../../types/maasTypes";

export interface SubscriptionConfigurationFormProps {
  formik: FormikProps<any>;
  subscriptionType: SubscriptionType;
  onSubscriptionTypeChange: (next: SubscriptionType) => void;
  cleanOnTypeSwitch?: boolean;

  applications: ApplicationReference[];
  adGroups: AdGroupReference[];
  onSearchApplications?: (search: string) => void;
  onSearchAdGroups?: (search: string) => void;
  isLoadingApplications?: boolean;
  isLoadingAdGroups?: boolean;
  applicationsHasMore?: boolean;
  adGroupsHasMore?: boolean;
  onLoadMoreApplications?: () => void;
  onLoadMoreAdGroups?: () => void;
}

export default function SubscriptionConfigurationForm({
  formik,
  subscriptionType,
  onSubscriptionTypeChange,
  cleanOnTypeSwitch = true,
  applications,
  adGroups,
  onSearchApplications,
  onSearchAdGroups,
  isLoadingApplications,
  isLoadingAdGroups,
  applicationsHasMore,
  adGroupsHasMore,
  onLoadMoreApplications,
  onLoadMoreAdGroups,
}: SubscriptionConfigurationFormProps) {
  const { t } = useTranslation("subscriptions");

  // Still use translations for environment/department only
  const getOptionsObj = (key: string) =>
    (t(key, { returnObjects: true }) as Record<string, string>) || {};

  const toOptions = (obj: Record<string, string>) =>
    Object.entries(obj).map(([value, label]) => ({ value, label }));

  const touched = (path: string) => Boolean(getIn(formik.touched, path));

  const error = (path: string) => {
    const e = getIn(formik.errors, path);
    return typeof e === "string" ? e : undefined;
  };

  const selectedApplication: ApplicationReference | null =
    subscriptionType === "NORMAL" &&
    formik.values.applicationReference &&
    typeof formik.values.applicationReference === "object"
      ? (formik.values.applicationReference as ApplicationReference)
      : null;

  const selectedAdGroup: AdGroupReference | null =
    subscriptionType === "NORMAL" &&
    formik.values.adGroupReference &&
    typeof formik.values.adGroupReference === "object"
      ? (formik.values.adGroupReference as AdGroupReference)
      : null;

  // Merge selected application into options if it's not in the backend list
  const mergedApplications = React.useMemo(() => {
    if (!selectedApplication) return applications;
    const exists = applications.some((a) => a.id === selectedApplication.id);
    return exists ? applications : [selectedApplication, ...applications];
  }, [applications, selectedApplication]);

  // Same for AD groups
  const mergedAdGroups = React.useMemo(() => {
    if (!selectedAdGroup) return adGroups;
    const exists = adGroups.some((g) => g.id === selectedAdGroup.id);
    return exists ? adGroups : [selectedAdGroup, ...adGroups];
  }, [adGroups, selectedAdGroup]);

  const applicationOptions = mergedApplications.map((a) => ({
    value: a.id,
    label: `${a.name} (${a.applicationId})`,
  }));

  const adGroupOptions = mergedAdGroups.map((g) => ({
    value: g.id,
    label: g.name,
  }));

  const handleSubscriptionTypeChange = useCallback(
    (next: SubscriptionType) => {
      onSubscriptionTypeChange(next);

      formik.setFieldTouched("applicationReference", false);
      formik.setFieldTouched("adGroupReference", false);
      formik.setFieldTouched("environment", false);

      if (cleanOnTypeSwitch && next === "SANDBOX") {
        formik.setFieldValue("environment", "");
        formik.setFieldValue("adGroupReference", null);
        formik.setFieldValue("applicationReference", "");
      }
    },
    [onSubscriptionTypeChange, formik, cleanOnTypeSwitch],
  );

  return (
    <>
      <SubscriptionTypeCards
        value={subscriptionType}
        onChange={handleSubscriptionTypeChange}
        showFeatures={false}
      />
      <form onSubmit={formik.handleSubmit} className="w-full flex flex-col">
        <div className="flex justify-between gap-8">
          {/* Subscription Name */}
          <div className="flex flex-col w-full">
            <FormLabel
              label={t("createSubscription.fields.subscriptionName.label")}
            />
            <FormTextarea
              id="subscriptionName"
              name="subscriptionName"
              value={formik.values.subscriptionName ?? ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder={t(
                "createSubscription.fields.subscriptionName.placeholder",
              )}
              formTouched={touched("subscriptionName")}
              formError={error("subscriptionName")}
              isSubscriptionElement
            />
          </div>

          {/* Application Reference (type-aware) */}
          <div className="flex flex-col w-full">
            <FormLabel
              label={t("createSubscription.fields.applicationRef.label")}
            />
            {subscriptionType === "NORMAL" ? (
              <FormSelect
                id="applicationReference"
                name="applicationReference"
                value={selectedApplication?.id ?? ""}
                onChange={(e) => {
                  const id = e.target.value as string;
                  const ref = applications.find((a) => a.id === id) || null;
                  formik.setFieldValue("applicationReference", ref);
                }}
                onBlur={formik.handleBlur}
                placeholder={t(
                  "createSubscription.fields.applicationRef.placeholder",
                )}
                options={applicationOptions}
                formTouched={touched("applicationReference")}
                formError={error("applicationReference")}
                isSubscriptionElement
                disabled={isLoadingApplications}
                onSearch={onSearchApplications}
                searchable={true}
                isLoading={isLoadingApplications}
                hasMore={applicationsHasMore}
                onLoadMore={onLoadMoreApplications}
              />
            ) : (
              <FormTextarea
                id="applicationReference"
                name="applicationReference"
                value={
                  typeof formik.values.applicationReference === "string"
                    ? formik.values.applicationReference
                    : ""
                }
                onChange={(e) => {
                  formik.setFieldValue("applicationReference", e.target.value);
                }}
                onBlur={formik.handleBlur}
                placeholder={t(
                  "createSubscription.fields.applicationRefFreeText.placeholder",
                )}
                formTouched={touched("applicationReference")}
                formError={error("applicationReference")}
                isSubscriptionElement
              />
            )}
          </div>
        </div>

        {/* Subscription Purpose */}
        <div className="flex flex-col w-full">
          <FormLabel
            label={t("createSubscription.fields.subscriptionPurpose.label")}
          />
          <FormTextarea
            id="subscriptionPurpose"
            name="subscriptionPurpose"
            value={formik.values.subscriptionPurpose ?? ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder={t(
              "createSubscription.fields.subscriptionPurpose.placeholder",
            )}
            formTouched={touched("subscriptionPurpose")}
            formError={error("subscriptionPurpose")}
            isSubscriptionElement
          />
        </div>

        {/* Environment + AD Group (NORMAL only) */}
        <div className="flex justify-between gap-8">
          {subscriptionType === "NORMAL" && (
            <div className="flex flex-col w-full">
              <FormLabel
                label={t("createSubscription.fields.environment.label")}
              />
              <FormSelect
                id="environment"
                name="environment"
                value={formik.values.environment ?? ""}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder={t(
                  "createSubscription.fields.environment.placeholder",
                )}
                options={toOptions(
                  getOptionsObj(
                    "createSubscription.fields.environment.options",
                  ),
                )}
                formTouched={touched("environment")}
                formError={error("environment")}
                isSubscriptionElement
              />
            </div>
          )}

          {subscriptionType === "NORMAL" && (
            <div className="flex flex-col w-full">
              <FormLabel label={t("createSubscription.fields.adGroup.label")} />
              <FormSelect
                id="adGroupReference"
                name="adGroupReference"
                value={selectedAdGroup?.id ?? ""}
                onChange={(e) => {
                  const id = e.target.value as string;
                  const ref = adGroups.find((g) => g.id === id) || null;
                  formik.setFieldValue("adGroupReference", ref);
                }}
                onBlur={formik.handleBlur}
                placeholder={t("createSubscription.fields.adGroup.placeholder")}
                options={adGroupOptions}
                formTouched={touched("adGroupReference")}
                formError={error("adGroupReference")}
                isSubscriptionElement
                disabled={isLoadingAdGroups}
                onSearch={onSearchAdGroups}
                searchable={true}
                isLoading={isLoadingAdGroups}
                hasMore={adGroupsHasMore}
                onLoadMore={onLoadMoreAdGroups}
              />
            </div>
          )}
        </div>

        {/* Department + Expiration Date */}
        <div className="flex justify-between gap-8">
          <div className="flex flex-col w-full">
            <FormLabel
              label={t("createSubscription.fields.department.label")}
            />
            <FormSelect
              id="department"
              name="department"
              value={formik.values.department ?? ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder={t(
                "createSubscription.fields.department.placeholder",
              )}
              options={toOptions(
                getOptionsObj("createSubscription.fields.department.options"),
              )}
              formTouched={touched("department")}
              formError={error("department")}
              isSubscriptionElement
            />
          </div>

          <div className="flex flex-col w-full">
            <FormLabel
              label={t("createSubscription.fields.expirationDate.label", {
                defaultValue: "Expiry Date",
              })}
            />
            <ExpiryDateUpdateSection
              expiryMode="setDate"
              onModeChange={() => {}}
              selectedDate={
                formik.values.expirationDate
                  ? dayjs(formik.values.expirationDate)
                  : null
              }
              onDateChange={(date) => {
                formik.setFieldValue(
                  "expirationDate",
                  date ? date.valueOf() : null,
                );
              }}
              showTabs={false}
              allowUnlimited={false}
              showLabel={false}
              variant="configuration"
            />
          </div>
        </div>
      </form>
    </>
  );
}
