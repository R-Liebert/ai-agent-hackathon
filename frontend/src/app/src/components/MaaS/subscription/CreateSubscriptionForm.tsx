import { FormikProps, getIn } from "formik";
import { TFunction } from "i18next";
import FormLabel from "../../Global/FormLabel";
import FormTextarea from "../../Global/FormTextarea";
import FormSelect from "../../Global/FormSelect";
import { CircularProgress } from "@mui/material";
import type { SelectOption } from "../../Global/SelectBase";
import type {
  ApplicationReference,
  AdGroupReference,
} from "../../../types/maasTypes";

interface CreateSubscriptionFormProps {
  formik: FormikProps<any>;
  subscriptionType: "NORMAL" | "SANDBOX";
  t: TFunction;
  applications: ApplicationReference[];
  adGroups: AdGroupReference[];
  onSearchApplications: (search: string) => void;
  onSearchAdGroups: (search: string) => void;
  isLoadingApplications: boolean;
  isLoadingAdGroups: boolean;
  applicationsHasMore: boolean;
  adGroupsHasMore: boolean;
  onLoadMoreApplications: () => void;
  onLoadMoreAdGroups: () => void;
}

export default function CreateSubscriptionForm({
  formik,
  subscriptionType,
  t,
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
}: CreateSubscriptionFormProps) {
  // Translations for environment/department options
  const getOptionsObj = (key: string) =>
    (t(key, { returnObjects: true }) as Record<string, string>) || {};

  const toOptions = (obj: Record<string, string>): SelectOption[] =>
    Object.entries(obj).map(([value, label]) => ({ value, label }));

  const touched = (path: string) => Boolean(getIn(formik.touched, path));
  const error = (path: string) => {
    const e = getIn(formik.errors, path);
    return typeof e === "string" ? e : undefined;
  };

  // Build options from backend data ONLY for applications and AD groups
  const applicationOptions: SelectOption[] = applications.map((a) => ({
    value: a.id,
    label: `${a.name} (${a.applicationId})`,
  }));

  const adGroupOptions: SelectOption[] = adGroups.map((g) => ({
    value: g.id,
    label: g.name,
  }));

  const selectedApplication =
    (formik.values.applicationReference as ApplicationReference | null) ?? null;

  const selectedAdGroup =
    (formik.values.adGroupReference as AdGroupReference | null) ?? null;

  const preventFormFromSubmitting =
    formik.isSubmitting || !formik.isValid || !formik.dirty;

  return (
    <form onSubmit={formik.handleSubmit} className="w-full">
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
          isSubscriptionElement={true}
        />
      </div>

      {/* Application Reference */}
      <div className="flex flex-col w-full ">
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
            isSubscriptionElement={true}
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
            value={(formik.values.applicationReference as string) ?? ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder={t(
              "createSubscription.fields.applicationRefFreeText.placeholder",
            )}
            formTouched={touched("applicationReference")}
            formError={error("applicationReference")}
            isSubscriptionElement={true}
          />
        )}
      </div>

      {/* AD Group Reference (Normal only) */}
      {subscriptionType === "NORMAL" && (
        <div className="flex flex-col w-full ">
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
            isSubscriptionElement={true}
            disabled={isLoadingAdGroups}
            onSearch={onSearchAdGroups}
            searchable={true}
            isLoading={isLoadingAdGroups}
            hasMore={adGroupsHasMore}
            onLoadMore={onLoadMoreAdGroups}
          />
        </div>
      )}

      {/* Subscription Purpose */}
      <div className="flex flex-col w-full ">
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
          isSubscriptionElement={true}
        />
      </div>

      {/* Environment (Normal only) */}
      {subscriptionType === "NORMAL" && (
        <div className="flex flex-col w-full ">
          <FormLabel label={t("createSubscription.fields.environment.label")} />
          <FormSelect
            id="environment"
            name="environment"
            value={formik.values.environment ?? ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder={t("createSubscription.fields.environment.placeholder")}
            options={toOptions(
              getOptionsObj("createSubscription.fields.environment.options"),
            )}
            formTouched={touched("environment")}
            formError={error("environment")}
            isSubscriptionElement={true}
          />
        </div>
      )}

      {/* Department */}
      <div className="flex flex-col w-full ">
        <FormLabel label={t("createSubscription.fields.department.label")} />
        <FormSelect
          id="department"
          name="department"
          value={formik.values.department ?? ""}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder={t("createSubscription.fields.department.placeholder")}
          options={toOptions(
            getOptionsObj("createSubscription.fields.department.options"),
          )}
          formTouched={touched("department")}
          formError={error("department")}
          isSubscriptionElement={true}
        />
      </div>
      {/* Submit */}
      <div className="mt-12">
        <button
          type="submit"
          data-testid="create-subscription-button"
          className={`${
            preventFormFromSubmitting
              ? "cursor-not-allowed opacity-20"
              : "cursor-pointer"
          } text-md font-body py-[.9em] flex bg-white-100 hover:bg-red-600 hover:text-white-100 text-gray-700 font-semibold transition-color duration-300 ease-out rounded-full w-full text-center place-content-center`}
          disabled={preventFormFromSubmitting}
          aria-label={t("createSubscription.cta.createSubscription")}
        >
          {formik.isSubmitting ? (
            <>
              {t("createSubscription.cta.submitting")}{" "}
              <CircularProgress
                size={18}
                className="ml-2"
                color="inherit"
                style={{ color: "white" }}
              />
            </>
          ) : (
            t("createSubscription.cta.createSubscription")
          )}
        </button>
      </div>
    </form>
  );
}
