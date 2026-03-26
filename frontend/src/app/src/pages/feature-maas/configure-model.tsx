import React, { useState } from "react";
import PageHeader from "../../components/MaaS/global/PageHeader";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";

const ConfigureModelPage = () => {
  const [models, setModels] = useState([]);
  const { t } = useTranslation("subscriptions");

  return (
    <div>
      <Helmet>
        <title>Configure Model</title>
        <meta name="description" content="Update details for your model" />
      </Helmet>
      <PageHeader
        title={t("addNewModel.title") ?? "Add New Model"}
        subtitle={
          t("addNewModel.subtitle") ??
          "Expand available AI models and enhance functionality for users."
        }
      ></PageHeader>
    </div>
  );
};

export default ConfigureModelPage;
