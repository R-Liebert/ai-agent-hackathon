import React, { useState } from "react";
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PsychologyIcon from "@mui/icons-material/Psychology";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import { ThinkDeeperPanelProps } from "../../interfaces/follow-ups";

export const ThinkDeeperPanel: React.FC<ThinkDeeperPanelProps> = ({
  questions,
  collapsedByDefault = true,
  onQuestionSelect,
  loading = false,
  error = null,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [expanded, setExpanded] = useState(!collapsedByDefault);

  const handleAccordionChange = (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded);
  };

  if (loading && (!questions || questions.length === 0) && !error) {
    return (
      <Box
        sx={{
          mt: 2,
          p: 2,
          backgroundColor: "#2F2F2F",
          borderRadius: "12px",
          border: "2px solid #3A3A3D",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={16} sx={{ color: "#EDEDED" }} />
          <Typography
            variant="body2"
            sx={{
              color: "#89898E",
              fontFamily: "'Nunito Sans', sans-serif",
              fontSize: "14px",
            }}
          >
            Generating follow-up questions...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Accordion
          expanded={expanded}
          onChange={handleAccordionChange}
          sx={{
            backgroundColor: "#2F2F2F",
            border: "2px solid #3A3A3D",
            borderRadius: "12px !important",
            boxShadow: "none",
            color: "#DEDEDE",
            fontFamily: "'Nunito Sans', sans-serif",
            "&:before": {
              display: "none",
            },
            "&.Mui-expanded": {
              margin: 0,
            },
          }}
        >
          <AccordionSummary
            expandIcon={
              <ExpandMoreIcon
                sx={{
                  color: "#EDEDED",
                  "&:hover": {
                    color: "#DEDEDE",
                  },
                }}
              />
            }
            aria-controls="think-deeper-error-content"
            id="think-deeper-error-header"
            sx={{
              borderRadius: "12px",
              "&.Mui-expanded": {
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              },
              "&:hover": {
                backgroundColor: "#424242",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ErrorOutlineIcon
                sx={{
                  color: "#977A24", // notification.warning color
                  fontSize: "1.2rem",
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: "#EDEDED",
                  fontFamily: "'Nunito Sans', sans-serif",
                  fontSize: "16px",
                }}
              >
                Think deeper
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Alert
              severity="info"
              sx={{
                mb: 2,
                backgroundColor: "#424242",
                color: "#DEDEDE",
                border: "1px solid #3A3A3D",
                borderRadius: "8px",
                "& .MuiAlert-icon": {
                  color: "#977A24",
                },
              }}
              icon={<ErrorOutlineIcon />}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'Nunito Sans', sans-serif",
                  fontSize: "14px",
                  color: "#DEDEDE",
                }}
              >
                {error.message}
              </Typography>
              {error.retryable && (
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  sx={{
                    mt: 1,
                    backgroundColor: "#3A3A3D",
                    color: "#DEDEDE",
                    border: "1px solid #3A3A3D",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontFamily: "'Nunito Sans', sans-serif",
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "#424242",
                      borderColor: "#424242",
                    },
                  }}
                  onClick={() => window.location.reload()}
                >
                  Try again
                </Button>
              )}
            </Alert>
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  }

  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Accordion
        expanded={expanded}
        onChange={handleAccordionChange}
        sx={{
          backgroundColor: "#2F2F2F",
          border: "2px solid #3A3A3D",
          borderRadius: "12px !important",
          boxShadow: "none",
          color: "#DEDEDE",
          fontFamily: "'Nunito Sans', sans-serif",
          "&:before": {
            display: "none",
          },
          "&.Mui-expanded": {
            margin: 0,
          },
        }}
      >
        <AccordionSummary
          expandIcon={
            <ExpandMoreIcon
              sx={{
                color: "#EDEDED",
                "&:hover": {
                  color: "#DEDEDE",
                },
              }}
            />
          }
          aria-controls="think-deeper-content"
          id="think-deeper-header"
          sx={{
            borderRadius: "12px",
            "&.Mui-expanded": {
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            },
            "&:hover": {
              backgroundColor: "#424242",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PsychologyIcon
              sx={{
                color: "#EDEDED", // Primary icon color
                fontSize: "1.2rem",
              }}
            />
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: "#EDEDED",
                fontFamily: "'Nunito Sans', sans-serif",
                fontSize: "16px",
              }}
            >
              Think deeper
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <List sx={{ p: 0 }}>
            {questions.map((question, index) => (
              <ListItem
                key={index}
                sx={{
                  py: 1,
                  px: 0,
                  "&:not(:last-child)": {
                    borderBottom: "1px solid #3A3A3D",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <PsychologyIcon
                    sx={{
                      color: "#89898E",
                      fontSize: "1rem",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={question}
                  primaryTypographyProps={{
                    variant: "body2",
                    sx: {
                      lineHeight: 1.4,
                      color: "#DEDEDE",
                      fontFamily: "'Nunito Sans', sans-serif",
                      fontSize: "14px",
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
