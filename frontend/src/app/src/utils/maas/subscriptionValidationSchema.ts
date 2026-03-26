import * as Yup from "yup";
import { TFunction } from "i18next";

export const validateEnvironment = (
  value: string | undefined,
): "PROD" | "NON_PROD" | undefined => {
  return value === "PROD" || value === "NON_PROD" ? value : undefined;
};

export const getValidationSchema = (
  subscriptionType: "NORMAL" | "SANDBOX",
  t: TFunction,
) => {
  const nameMin = 3;
  const nameMax = 50;
  const freeTextMax = 100;
  const purposeMax = 200;
  const isNormal = subscriptionType === "NORMAL";

  const safeStr = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  return Yup.object({
    // Subscription name
    subscriptionName: Yup.string()
      .transform(safeStr)
      .required(
        t(
          "createSubscription.fields.subscriptionName.validation.messages.required",
        ) as string,
      )
      .min(
        nameMin,
        t(
          "createSubscription.fields.subscriptionName.validation.messages.minLength",
          { minLength: nameMin },
        ) as string,
      )
      .max(
        nameMax,
        t(
          "createSubscription.fields.subscriptionName.validation.messages.maxLength",
          { maxLength: nameMax },
        ) as string,
      ),

    // Application reference:
    // NORMAL  -> ApplicationReference object
    // SANDBOX -> free-text string in applicationReference
    applicationReference: isNormal
      ? Yup.object({
          id: Yup.string().required(
            t(
              "createSubscription.fields.applicationRef.validation.messages.required",
            ) as string,
          ),
          name: Yup.string().required(),
          applicationId: Yup.string().required(),
        })
          .nullable()
          .required(
            t(
              "createSubscription.fields.applicationRef.validation.messages.required",
            ) as string,
          )
      : Yup.string()
          .transform(safeStr)
          .min(
            nameMin,
            t(
              "createSubscription.fields.applicationRefFreeText.validation.messages.minLength",
              { minLength: nameMin },
            ) as string,
          )
          .max(
            freeTextMax,
            t(
              "createSubscription.fields.applicationRefFreeText.validation.messages.maxLength",
              { maxLength: freeTextMax },
            ) as string,
          )
          .required(
            t(
              "createSubscription.fields.applicationRefFreeText.validation.messages.required",
            ) as string,
          ),

    // Subscription purpose
    subscriptionPurpose: Yup.string()
      .transform(safeStr)
      .max(
        purposeMax,
        t(
          "createSubscription.fields.subscriptionPurpose.validation.messages.maxLength",
          { maxLength: purposeMax },
        ) as string,
      )
      .required(
        t(
          "createSubscription.fields.subscriptionPurpose.validation.messages.required",
        ) as string,
      ),

    // Environment (NORMAL only)
    environment: isNormal
      ? Yup.string()
          .oneOf(
            ["PROD", "NON_PROD"],
            t(
              "createSubscription.fields.environment.validation.messages.invalid",
              {
                defaultValue: t(
                  "createSubscription.fields.environment.validation.messages.required",
                ),
              },
            ) as string,
          )
          .required(
            t(
              "createSubscription.fields.environment.validation.messages.required",
            ) as string,
          )
      : Yup.string().notRequired(),

    // Department
    department: Yup.string()
      .transform(safeStr)
      .required(
        t(
          "createSubscription.fields.department.validation.messages.required",
        ) as string,
      ),

    // AD group (NORMAL only)
    adGroupReference: isNormal
      ? Yup.object({
          id: Yup.string().required(
            t(
              "createSubscription.fields.adGroup.validation.messages.required",
            ) as string,
          ),
          name: Yup.string().required(),
        })
          .nullable()
          .required(
            t(
              "createSubscription.fields.adGroup.validation.messages.required",
            ) as string,
          )
      : Yup.mixed().notRequired(),

    // Expiry Date
    expirationDate: Yup.number()
      .nullable()
      .min(
        Date.now(),
        t(
          "createSubscription.fields.expirationDate.validation.messages.future",
          {
            defaultValue: "Expiry date must be in the future.",
          },
        ),
      )
      .notRequired(),
  });
};
