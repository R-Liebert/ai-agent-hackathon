import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Slide from "@mui/material/Slide";
import "./delete-history-button.css";
import { Fab } from "@mui/material";
import Tooltip from "../Global/Tooltip";
import DeleteIcon from "@mui/icons-material/Delete";
import { TransitionProps } from "@mui/material/transitions";
import { useTranslation } from "react-i18next";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});
interface ChatHistoryProps {
  onDeleteConfirmed: () => void; // Update the type to ChatDialogue
}
export default function DeleteHistoryButton(props: ChatHistoryProps) {
  const [open, setOpen] = React.useState(false);

  const { t } = useTranslation();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const handleDeleteConfirmed = () => {
    props.onDeleteConfirmed();
    setOpen(false);
  };

  return (
    <div>
      <div className="delete-button-container">
        <Tooltip
          text={t("components:deleteHistoryButton.tooltip.title")}
          useMui
        >
          <Fab size="medium" aria-label="Delete" onClick={handleClickOpen}>
            <DeleteIcon />
          </Fab>
        </Tooltip>
      </div>
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle>
          {t("components:deleteHistoryButton.dialog.title")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description">
            {t("components:deleteHistoryButton.dialog.description")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            {t("components:deleteHistoryButton.buttons.cancel")}
          </Button>
          <Button onClick={handleDeleteConfirmed}>
            {t("components:deleteHistoryButton.buttons.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
