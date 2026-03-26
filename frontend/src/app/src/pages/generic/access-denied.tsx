import GenericErrorPageContent from "../../components/Global/AppGenericErrorPage";
import image from "../../assets/accesserror.png";

const AccessDeniedPage = () => {
  return (
    <GenericErrorPageContent
      title="common:genericPages.accessDenied.title"
      description="common:genericPages.accessDenied.description"
      image={image}
      errorType="403"
      pageTitle="Access Denied"
    />
  );
};

export default AccessDeniedPage;
