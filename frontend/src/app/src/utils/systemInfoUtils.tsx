import { TFunction } from "i18next";

export const getDeviceType = (t: TFunction): string => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/mobile|android|iphone|ipod/.test(userAgent)) {
    if (
      /ipad/.test(userAgent) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 1)
    ) {
      return t(
        "feedback:forms.bugReportForm.systemInformation.deviceType.tablet"
      );
    }
    return t(
      "feedback:forms.bugReportForm.systemInformation.deviceType.mobile"
    );
  }
  return t("feedback:forms.bugReportForm.systemInformation.deviceType.desktop");
};

export const getOperatingSystem = (t: TFunction): string => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("windows"))
    return t(
      "feedback:forms.bugReportForm.systemInformation.operatingSystem.windows"
    );
  if (userAgent.includes("mac os") || userAgent.includes("macintosh"))
    return t(
      "feedback:forms.bugReportForm.systemInformation.operatingSystem.macos"
    );
  if (userAgent.includes("linux"))
    return t(
      "feedback:forms.bugReportForm.systemInformation.operatingSystem.linux"
    );
  if (userAgent.includes("android"))
    return t(
      "feedback:forms.bugReportForm.systemInformation.operatingSystem.android"
    );
  if (/iphone|ipad|ipod/.test(userAgent))
    return t(
      "feedback:forms.bugReportForm.systemInformation.operatingSystem.ios"
    );

  return t(
    "feedback:forms.bugReportForm.systemInformation.operatingSystem.other"
  );
};

export const getBrowserType = (t: TFunction): string => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("chrome") && !userAgent.includes("edg"))
    return t(
      "feedback:forms.bugReportForm.systemInformation.browserType.chrome"
    );
  if (userAgent.includes("firefox"))
    return t(
      "feedback:forms.bugReportForm.systemInformation.browserType.firefox"
    );
  if (userAgent.includes("safari") && !userAgent.includes("chrome"))
    return t(
      "feedback:forms.bugReportForm.systemInformation.browserType.safari"
    );
  if (userAgent.includes("edg"))
    return t("feedback:forms.bugReportForm.systemInformation.browserType.edge");
  if (userAgent.includes("opera") || userAgent.includes("opr"))
    return t(
      "feedback:forms.bugReportForm.systemInformation.browserType.opera"
    );

  return t("feedback:forms.bugReportForm.systemInformation.browserType.other");
};
