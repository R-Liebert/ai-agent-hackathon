import React from "react";
import TabsBar, { TabItem } from "../global/TabsBar";
import SearchInputField from "../../Global/AppSearchField";
import { type AdminTab } from "../../../types/maasTypes";

type Props = {
  tabs: TabItem[];
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;

  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  isNarrowSearch?: boolean;
  ariaLabel?: string;
};

export default function AdminTabsSection({
  tabs,
  activeTab,
  onTabChange,
  searchPlaceholder,
  onSearch,
  isNarrowSearch = true,
  ariaLabel = "Admin Dashboard",
}: Props) {
  return (
    <div className="flex flex-col justify-between w-full items-start mt-2 mb-8">
      {onSearch && (
        <div className="-mt-6 -mb-4 w-full flex">
          {" "}
          <SearchInputField
            placeholder="Search..."
            onSearch={onSearch}
            isNarrow={true}
          />
        </div>
      )}
      <TabsBar
        items={tabs}
        activeKey={activeTab}
        onChange={(key) => onTabChange(key as AdminTab)}
        ariaLabel={ariaLabel}
      />
    </div>
  );
}
