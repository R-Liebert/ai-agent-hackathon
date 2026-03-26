import React, { useState } from "react";
import PageHeader from "../../components/MaaS/global/PageHeader";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";

const AddModelPage = () => {
  const [models, setModels] = useState([]);
  const { t } = useTranslation("subscriptions");

  return (
    <div>
      <Helmet>
        <title>Add New Models</title>
        <meta name="description" content="Expand models catalogue" />
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

export default AddModelPage;
