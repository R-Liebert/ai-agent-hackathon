import { styled } from "@mui/material/styles";
import { Tab } from "@mui/material";

// Styled Tab component with consistent styling
const StyledTab = styled(Tab)(() => ({
  fontFamily: '"Nunito Sans", sans-serif',
  fontSize: "0.9rem",
  fontWeight: 600,
  textTransform: "none",
  minHeight: "56px",
  color: "#DEDEDE",
  "&.Mui-selected": {
    color: "#EDEDED",
  },
  "& .MuiTab-iconWrapper": {
    marginRight: "8px",
    marginBottom: "0 !important",
  },
}));

export default StyledTab;
