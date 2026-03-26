import React from "react";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { SortField, SortDirection } from "./types";

interface FileListHeaderProps {
  loading: boolean;
  isSearching: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export const FileListHeader: React.FC<FileListHeaderProps> = ({
  loading,
  isSearching,
  sortField,
  sortDirection,
  onSort,
}) => {
  const { t } = useTranslation();

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <FaSort className="opacity-50" size={12} />;
    return sortDirection === "asc" ? (
      <FaSortUp size={12} />
    ) : (
      <FaSortDown size={12} />
    );
  };

  if (isSearching) return null;

  return (
    <div className="flex items-center w-full px-4 py-2 border-b border-[rgba(237,237,237,0.1)] text-sm font-body bg-gray-600">
      <div className="flex items-center min-w-[40px]" />
      <button
        onClick={() => !loading && onSort("name")}
        className={`pl-1 flex-1 min-w-0 pr-4 flex items-center gap-2 hover:text-white-100 transition-colors ${
          loading ? "opacity-50 pointer-events-none" : ""
        } ${sortField === "name" ? "text-white-100" : "text-white-100/50"}`}
        disabled={loading}
      >
        {t("workspaces:common:sharePointPicker:columns:fileName")}
        {getSortIcon("name")}
      </button>
      <button
        onClick={() => !loading && onSort("size")}
        className={`flex-shrink-0 w-24 text-right pr-3 flex items-center gap-2 justify-end hover:text-white-100 transition-colors ${
          loading ? "opacity-50 pointer-events-none" : ""
        } ${sortField === "size" ? "text-white-100" : "text-white-100/50"}`}
        disabled={loading}
      >
        {t("workspaces:common:sharePointPicker:columns:size")}
        {getSortIcon("size")}
      </button>
      <button
        onClick={() => !loading && onSort("lastModified")}
        className={`flex-shrink-0 w-40 text-right flex items-center gap-2 justify-end hover:text-white-100 transition-colors ${
          loading ? "opacity-50 pointer-events-none" : ""
        } ${
          sortField === "lastModified" ? "text-white-100" : "text-white-100/50"
        }`}
        disabled={loading}
      >
        {t("workspaces:common:sharePointPicker:columns:lastModified")}
        {getSortIcon("lastModified")}
      </button>
    </div>
  );
};
