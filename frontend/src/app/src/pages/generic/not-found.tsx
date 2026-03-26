import GenericErrorPageContent from "../../components/Global/AppGenericErrorPage";
import image from "../../assets/notfound.png";

const NotFoundPage = () => {
  return (
    <GenericErrorPageContent
      title="common:genericPages.notFound.title"
      description="common:genericPages.notFound.description"
      image={image}
      errorType="404"
      pageTitle="Not Found"
    />
  );
};

export default NotFoundPage;
