import React, { useEffect, useState } from "react";
import { Modal, Fade } from "@mui/material";

interface ModalContainerProps {
  open: boolean;
  title: string;
  width?: string;
  children: React.ReactNode;
  onClose: () => void;
}

const handleModalContentClick = (e: React.MouseEvent) => {
  e.stopPropagation();
};

const ModalContainer: React.FC<ModalContainerProps> = ({
  open,
  title,
  width = "max-w-lg",
  children,
  onClose,
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  return (
    <>
      {" "}
      {open && <div className="modal-overlay"></div>}
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{
          backdropFilter: "blur(1px)",
          backgroundColor: "rgba(50, 50, 50, 0.2)",
        }}
        disableScrollLock={true}
        keepMounted={false}
      >
        <Fade
          in={open}
          timeout={{
            enter: 220,
            exit: 160,
          }}
        >
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-700 rounded-2xl w-11/12 ${width} pb-4 shadow-modal outline-none`}
          >
            <div className="flex px-4 py-3 w-full mx-auto justify-between align-center place-content-center h-auto sticky top-0 z-10">
              <h2 className="text-lg font-medium flex text-left font-body">
                {title}
              </h2>
            </div>
            <div className="px-4 pt-0 !font-body">{children}</div>
          </div>
        </Fade>
      </Modal>
    </>
  );
};

export default ModalContainer;
