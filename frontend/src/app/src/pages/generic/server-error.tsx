import GenericErrorPageContent from "../../components/Global/AppGenericErrorPage";
import image from "../../assets/servererror.png";

const ServerErrorPage = () => {
  return (
    <GenericErrorPageContent
      title="common:genericPages.serverError.title"
      description="common:genericPages.serverError.description"
      image={image}
      errorType="500"
      pageTitle="Server Error"
    />
  );
};

export default ServerErrorPage;
