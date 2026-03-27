import { useEffect, useState, useRef, useCallback } from "react";
import { WorkspaceDto, WorkspaceMemberDto } from "../../models/workspace-model";
import WorkspaceCard from "./workspace-card";
import SearchField from "../Global/AppSearchField";
import WorkspaceOrganizer from "./workspace-organizer";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useMsal } from "../../hooks/useMsalMock";

type WorkspaceGridDto = {
  workspaceId: string;
  workspaceName: string;
  files: number;
  members: WorkspaceMemberDto[];
  memberCount: number;
  imageUrl?: string;
  color?: string;
  createdAt: Date;
  updatedAt?: Date;
};

type WorkspaceGridProps = {
  userWorkspaces: WorkspaceDto[] | undefined;
  onWorkspaceCardClick: (workspaceId: string) => void;
  searchPlaceholder: string;
};

const WorkspaceGrid = ({
  userWorkspaces,
  onWorkspaceCardClick,
  searchPlaceholder,
}: WorkspaceGridProps) => {
  const [filteredWorkspaces, setFilteredWorkspaces] = useState<
    WorkspaceGridDto[]
  >([]);
  const [filterOption, setFilterOption] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("");
  const [noWorkspacesMessage, setNoWorkspacesMessage] = useState<string | null>(
    null
  );
  const { t } = useTranslation();
  const { accounts } = useMsal();
  const activeUserId = accounts[0].localAccountId;

  useEffect(() => {
    const workspaces = userWorkspaces
      ? userWorkspaces.map((x) => ({
          workspaceId: x.id,
          workspaceName: x.name,
          files: x.fileCount,
          memberCount: x.memberCount,
          members: x.members,
          imageUrl: x.imageUrl,
          color: x.color,
          createdAt: x.createdAt ? new Date(x.createdAt) : new Date(), // Fallback to current date.
          updatedAt: x.updatedAt ? new Date(x.updatedAt) : new Date(), // Fallback to updated date.
        }))
      : [];
    applyFilteringAndSorting(workspaces);
  }, [userWorkspaces, filterOption, sortOption]);

  useEffect(() => {
    // Retrieve filter and sort options from localStorage on mount
    const savedFilterOption = localStorage.getItem("filterOption");
    const savedSortOption = localStorage.getItem("sortOption");

    if (savedFilterOption) {
      setFilterOption(savedFilterOption);
    }
    if (savedSortOption) {
      setSortOption(savedSortOption);
    }
  }, []);

  useEffect(() => {
    // Save filter and sort options to localStorage whenever they change
    localStorage.setItem("filterOption", filterOption);
  }, [filterOption]);

  useEffect(() => {
    localStorage.setItem("sortOption", sortOption);
  }, [sortOption]);

  const onFilterChanged = (input: string) => {
    const workspaces = userWorkspaces
      ? userWorkspaces.map((x) => ({
          workspaceId: x.id,
          workspaceName: x.name,
          files: x.fileCount,
          memberCount: x.memberCount,
          members: x.members,
          imageUrl: x.imageUrl,
          color: x.color,
          createdAt: x.createdAt,
          updatedAt: x.updatedAt,
        }))
      : [];
    if (!input || input.length === 0) {
      setFilteredWorkspaces(workspaces);
    } else {
      setFilteredWorkspaces(
        workspaces.filter((x) =>
          x.workspaceName.toLowerCase().includes(input.toLowerCase())
        )
      );
    }
  };

  const applyFiltering = (workspaces: WorkspaceGridDto[]) => {
    let filtered = [...workspaces];

    // Date range
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Reset message if filter is not "Recently Created" or "Recently Updated"
    if (
      filterOption !==
        t(
          "workspaces:listing.filteringAndSorting.filtering.options.recentlyCreated"
        ) &&
      filterOption !==
        t(
          "workspaces:listing.filteringAndSorting.filtering.options.recentlyUpdated"
        )
    ) {
      setNoWorkspacesMessage(null);
    }

    if (
      filterOption ===
      t("workspaces:listing.filteringAndSorting.filtering.options.myWorkspaces")
    ) {
      filtered = filtered.filter((x) =>
        x.members.some((member) => member.isOwner && member.id === activeUserId)
      );
    } else if (
      filterOption ===
      t(
        "workspaces:listing.filteringAndSorting.filtering.options.recentlyCreated"
      )
    ) {
      filtered = filtered.filter((x) => x.createdAt >= oneWeekAgo);
      setNoWorkspacesMessage(
        filtered.length === 0
          ? t(
              "workspaces:listing.filteringAndSorting.filtering.messages.notCreated"
            )
          : null
      );
    } else if (
      filterOption ===
      t(
        "workspaces:listing.filteringAndSorting.filtering.options.recentlyUpdated"
      )
    ) {
      filtered = filtered.filter(
        (x) => x.updatedAt && new Date(x.updatedAt) >= oneWeekAgo
      );
      setNoWorkspacesMessage(
        filtered.length === 0
          ? t(
              "workspaces:listing.filteringAndSorting.filtering.messages.notUpdated"
            )
          : null
      );
    }

    return filtered;
  };

  const applySorting = (workspaces: WorkspaceGridDto[]) => {
    let sorted = [...workspaces];

    if (
      sortOption ===
      t(
        "workspaces:listing.filteringAndSorting.sorting.options.creationDateNewest"
      )
    ) {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (
      sortOption ===
      t(
        "workspaces:listing.filteringAndSorting.sorting.options.creationDateOldest"
      )
    ) {
      sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (
      sortOption ===
      t("workspaces:listing.filteringAndSorting.sorting.options.nameAsc")
    ) {
      sorted.sort((a, b) => a.workspaceName.localeCompare(b.workspaceName));
    } else if (
      sortOption ===
      t("workspaces:listing.filteringAndSorting.sorting.options.nameDesc")
    ) {
      sorted.sort((a, b) => b.workspaceName.localeCompare(a.workspaceName));
    }

    return sorted;
  };

  const applyFilteringAndSorting = (workspaces: WorkspaceGridDto[]) => {
    let filtered = [...workspaces];

    filtered = applyFiltering(filtered);

    filtered = applySorting(filtered);

    setFilteredWorkspaces(filtered);
  };

  const filterOptions = [
    t("workspaces:listing.filteringAndSorting.filtering.options.allWorkspaces"),
    t("workspaces:listing.filteringAndSorting.filtering.options.myWorkspaces"),
    t(
      "workspaces:listing.filteringAndSorting.filtering.options.recentlyUpdated"
    ),
    t(
      "workspaces:listing.filteringAndSorting.filtering.options.recentlyCreated"
    ),
  ];
  const sortOptions = [
    t(
      "workspaces:listing.filteringAndSorting.sorting.options.creationDateNewest"
    ),
    t(
      "workspaces:listing.filteringAndSorting.sorting.options.creationDateOldest"
    ),
    t("workspaces:listing.filteringAndSorting.sorting.options.nameAsc"),
    t("workspaces:listing.filteringAndSorting.sorting.options.nameDesc"),
  ];

  return (
    <>
      <div className="grid grid-cols-1 w-full px-4 sm:px-12 md:px-0">
        <SearchField
          placeholder={searchPlaceholder}
          onSearch={onFilterChanged}
        />
      </div>

      <div className="flex space-x-2 font-medium font-body text-md w-full px-4 sm:px-12 md:px-0 flex-wrap justify-end">
        <WorkspaceOrganizer
          options={filterOptions}
          selectedOption={filterOption}
          onOptionChange={setFilterOption}
          label={t("workspaces:listing.filteringAndSorting.filtering.label")}
          anchorElRef={useRef(null)}
          position={{ vertical: "bottom", horizontal: "left" }}
        />
        <WorkspaceOrganizer
          options={sortOptions}
          selectedOption={sortOption}
          onOptionChange={setSortOption}
          label={t("workspaces:listing.filteringAndSorting.sorting.label")}
          anchorElRef={useRef(null)}
          position={{ vertical: "bottom", horizontal: "right" }}
        />
      </div>
      {/* Display message if no workspaces are found*/}
      {noWorkspacesMessage && (
        <AnimatePresence>
          <motion.div
            className="grid grid-cols-1 gap-4 mt-10 mb-20 w-full px-4 sm:px-12 md:px-0 text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {noWorkspacesMessage}
          </motion.div>
        </AnimatePresence>
      )}
      <AnimatePresence>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 mb-20 w-full px-4 sm:px-12 md:px-0"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4 }}
        >
          {filteredWorkspaces.map((workspace, index) => (
            <motion.div
              key={`${workspace.workspaceId}-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <WorkspaceCard
                workspace={workspace}
                onWorkspaceCardClick={onWorkspaceCardClick}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default WorkspaceGrid;
