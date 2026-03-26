import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ApiRequestLog } from "src/types/maasTypes";

interface ApiRequestsPanelProps {
  apiRequests?: ApiRequestLog[];
  onSimulateApiRequest: () => void;
}

const ApiRequestsPanel: React.FC<ApiRequestsPanelProps> = ({
  apiRequests = [],
  onSimulateApiRequest,
}) => {
  const { t, i18n } = useTranslation("subscriptions");

  const tableHeadElClass = "px-5 py-3 font-body font-normal";
  const tableBodyElClass = "px-5 py-3 text-sm";

  const hasLogs = apiRequests.length > 0;

  // Locale-aware formatters
  const nf = useMemo(
    () => new Intl.NumberFormat(i18n.language),
    [i18n.language],
  );
  const dateToString = (ts: number) =>
    new Date(ts).toLocaleString(i18n.language);

  return (
    <section id="tab-panel-apiRequests" aria-labelledby="api-heading">
      <div className="flex justify-between w-full mb-9">
        {/* Simulate API Request Button */}
        <button
          className="px-4 py-2 font-body rounded-full bg-white-100 text-gray-700 hover:bg-red-600 hover:text-white-100 text-sm font-semibold"
          onClick={onSimulateApiRequest}
          aria-label={t(
            "subscriptionDetails.apiRequestsTable.simulate",
            "Simulate API Request",
          )}
          title={t(
            "subscriptionDetails.apiRequestsTable.simulate",
            "Simulate API Request",
          )}
        >
          {t(
            "subscriptionDetails.apiRequestsTable.simulate",
            "Simulate API Request",
          )}
        </button>
      </div>

      {hasLogs ? (
        <div className="overflow-x-auto border-2 border-gray-500 rounded-xl">
          <table
            className="table-fixed w-full font-body"
            aria-label={t(
              "subscriptionDetails.tabs.apiRequests",
              "API Requests",
            )}
          >
            <colgroup>
              <col className="w-[24%]" /> {/* Timestamp */}
              <col className="w-[20%]" /> {/* Model */}
              <col className="w-[20%]" /> {/* Tokens */}
              <col className="w-[20%]" /> {/* Latency */}
              <col className="w-[16%]" /> {/* Status */}
            </colgroup>

            <thead className="bg-gray-650 text-white-100 text-md">
              <tr>
                <th scope="col" className={`${tableHeadElClass} text-left`}>
                  {t(
                    "subscriptionDetails.apiRequestsTable.headers.timestamp",
                    "Timestamp",
                  )}
                </th>
                <th scope="col" className={`${tableHeadElClass} text-center`}>
                  {t(
                    "subscriptionDetails.apiRequestsTable.headers.model",
                    "Model",
                  )}
                </th>
                <th scope="col" className={`${tableHeadElClass} text-center`}>
                  {t(
                    "subscriptionDetails.apiRequestsTable.headers.tokens",
                    "Tokens",
                  )}
                </th>
                <th scope="col" className={`${tableHeadElClass} text-center`}>
                  {t(
                    "subscriptionDetails.apiRequestsTable.headers.latencyMs",
                    "Latency (ms)",
                  )}
                </th>
                <th scope="col" className={`${tableHeadElClass} text-right`}>
                  {t(
                    "subscriptionDetails.apiRequestsTable.headers.status",
                    "Status",
                  )}
                </th>
              </tr>
            </thead>

            <tbody className="bg-gray-700">
              {apiRequests.map((log) => {
                const isSuccess = log.responseStatus === "SUCCESS";
                const statusKey = isSuccess ? "success" : "error";
                const statusLabel = t(
                  `subscriptionDetails.apiRequestsTable.status.${statusKey}`,
                  isSuccess ? "Success" : "Error",
                );

                return (
                  <tr
                    key={log.id}
                    className="border-t-2 border-gray-500 hover:bg-gray-600 transition-colors"
                  >
                    {/* Timestamp */}
                    <td
                      className={`${tableBodyElClass} text-left whitespace-nowrap`}
                    >
                      {dateToString(log.timestamp)}
                    </td>

                    {/* Model */}
                    <td className={`${tableBodyElClass} text-center`}>
                      {log.modelKey}
                    </td>

                    {/* Tokens */}
                    <td className={`${tableBodyElClass} text-center`}>
                      {nf.format(log.tokensUsed)}
                    </td>

                    {/* Latency */}
                    <td className={`${tableBodyElClass} text-center`}>
                      {nf.format(log.responseTimeMs)}
                    </td>

                    {/* Status */}
                    <td className={`${tableBodyElClass} text-right`}>
                      <span
                        className={[
                          "inline-flex items-center px-3 py-1 rounded-full text-sm font-normal capitalize border-2 bg-transparent",
                          isSuccess
                            ? "border-green-400 text-green-400"
                            : "border-red-300 text-red-300",
                        ].join(" ")}
                      >
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-md font-body text-gray-300">
          {t("subscriptionDetails.apiRequestsTable.empty")}
        </p>
      )}
    </section>
  );
};

export default ApiRequestsPanel;
