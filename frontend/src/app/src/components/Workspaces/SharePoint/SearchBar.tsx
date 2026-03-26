import React from "react";
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  CircularProgress,
} from "@mui/material";
import { FaSearch, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface SearchBarProps {
  searchQuery: string;
  isSearching: boolean;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  isSearching,
  onSearchChange,
  onClearSearch,
}) => {
  const { t } = useTranslation();

  return (
    <TextField
      size="small"
      placeholder={t("workspaces:common.sharePointPicker.search")}
      value={searchQuery}
      onChange={onSearchChange}
      className="w-[15rem] mr-2"
      autoComplete="off"
      InputProps={{
        className: "bg-gray-400 text-white-100 !rounded-lg !text-sm !font-body",
        startAdornment: (
          <InputAdornment position="start">
            <Box className="relative w-5 h-5 flex items-center justify-center">
              <FaSearch
                className={`text-white-100/70 absolute transition-opacity duration-200 ease-in-out ${
                  isSearching ? "opacity-0" : "opacity-100"
                }`}
              />
              <CircularProgress
                size={20}
                sx={{ color: "white" }}
                className={`absolute transition-opacity duration-200 ease-in-out ${
                  isSearching ? "opacity-100" : "opacity-0"
                }`}
              />
            </Box>
          </InputAdornment>
        ),
        endAdornment: searchQuery && (
          <InputAdornment position="end">
            <IconButton
              onClick={onClearSearch}
              size="small"
              className="text-white-100 hover:bg-white/10"
            >
              <FaTimes size={14} className="text-white-100" />
            </IconButton>
          </InputAdornment>
        ),
        sx: {
          "& input": {
            color: "white",
            "&::placeholder": {
              color: "rgba(255, 255, 255, 0.7)",
              opacity: 1,
            },
          },
          "& fieldset": {
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
          "&:hover fieldset": {
            borderColor: "rgba(255, 255, 255, 0.9) !important",
          },
          "&.Mui-focused fieldset": {
            borderColor: "rgba(255, 255, 255, 0.9) !important",
          },
        },
      }}
    />
  );
};
