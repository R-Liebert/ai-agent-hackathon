import { useEffect, useState, useCallback } from "react";
import { maasService } from "../services/maasService";
import type {
  ApplicationReference,
  AdGroupReference,
} from "../types/maasTypes";

const PAGE_SIZE = 20;

export const useApplicationsAndAdGroups = () => {
  const [applications, setApplications] = useState<ApplicationReference[]>([]);
  const [adGroups, setAdGroups] = useState<AdGroupReference[]>([]);

  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [isLoadingAdGroups, setIsLoadingAdGroups] = useState(false);

  const [isLoadingMoreApplications, setIsLoadingMoreApplications] =
    useState(false);
  const [isLoadingMoreAdGroups, setIsLoadingMoreAdGroups] = useState(false);

  const [applicationsPage, setApplicationsPage] = useState(1);
  const [adGroupsPage, setAdGroupsPage] = useState(1);

  const [applicationsHasMore, setApplicationsHasMore] = useState(true);
  const [adGroupsHasMore, setAdGroupsHasMore] = useState(true);

  const [applicationsSearch, setApplicationsSearch] = useState<string>("");
  const [adGroupsSearch, setAdGroupsSearch] = useState<string>("");

  // Helper: derive hasMore from response
  const computeHasMore = (itemsLength: number) => {
    return itemsLength === PAGE_SIZE;
  };

  // Initial load
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoadingApplications(true);
        setIsLoadingAdGroups(true);

        const [appsResp, groupsResp] = await Promise.all([
          maasService.getApplications(undefined, 1, PAGE_SIZE),
          maasService.getAdGroups(undefined, 1, PAGE_SIZE),
        ]);

        setApplications(
          appsResp.items.map((a) => ({
            id: a.id,
            name: a.name,
            applicationId: a.applicationId,
          })),
        );
        setApplicationsPage(1);
        setApplicationsHasMore(computeHasMore(appsResp.items.length));

        setAdGroups(
          groupsResp.items.map((g) => ({
            id: g.id,
            name: g.name,
          })),
        );
        setAdGroupsPage(1);
        setAdGroupsHasMore(computeHasMore(groupsResp.items.length));
      } finally {
        setIsLoadingApplications(false);
        setIsLoadingAdGroups(false);
      }
    };

    load();
  }, []);

  // Search Applications (reset to first page)
  const searchApplications = useCallback(async (search: string) => {
    try {
      setIsLoadingApplications(true);
      setApplicationsSearch(search);

      const resp = await maasService.getApplications(search, 1, PAGE_SIZE);

      setApplications(
        resp.items.map((a) => ({
          id: a.id,
          name: a.name,
          applicationId: a.applicationId,
        })),
      );
      setApplicationsPage(1);
      setApplicationsHasMore(computeHasMore(resp.items.length));
    } finally {
      setIsLoadingApplications(false);
    }
  }, []);

  // Search Ad Groups (reset to first page)
  const searchAdGroups = useCallback(async (search: string) => {
    try {
      setIsLoadingAdGroups(true);
      setAdGroupsSearch(search);

      const resp = await maasService.getAdGroups(search, 1, PAGE_SIZE);

      setAdGroups(
        resp.items.map((g) => ({
          id: g.id,
          name: g.name,
        })),
      );
      setAdGroupsPage(1);
      setAdGroupsHasMore(computeHasMore(resp.items.length));
    } finally {
      setIsLoadingAdGroups(false);
    }
  }, []);

  // Load more applications
  const loadMoreApplications = useCallback(async () => {
    if (isLoadingMoreApplications || !applicationsHasMore) return;

    try {
      setIsLoadingMoreApplications(true);
      const nextPage = applicationsPage + 1;

      const resp = await maasService.getApplications(
        applicationsSearch || undefined,
        nextPage,
        PAGE_SIZE,
      );

      setApplications((prev) => [
        ...prev,
        ...resp.items.map((a) => ({
          id: a.id,
          name: a.name,
          applicationId: a.applicationId,
        })),
      ]);

      setApplicationsPage(nextPage);
      setApplicationsHasMore(computeHasMore(resp.items.length));
    } finally {
      setIsLoadingMoreApplications(false);
    }
  }, [
    applicationsPage,
    applicationsSearch,
    applicationsHasMore,
    isLoadingMoreApplications,
  ]);

  // Load more ad groups
  const loadMoreAdGroups = useCallback(async () => {
    if (isLoadingMoreAdGroups || !adGroupsHasMore) return;

    try {
      setIsLoadingMoreAdGroups(true);
      const nextPage = adGroupsPage + 1;

      const resp = await maasService.getAdGroups(
        adGroupsSearch || undefined,
        nextPage,
        PAGE_SIZE,
      );

      setAdGroups((prev) => [
        ...prev,
        ...resp.items.map((g) => ({
          id: g.id,
          name: g.name,
        })),
      ]);

      setAdGroupsPage(nextPage);
      setAdGroupsHasMore(computeHasMore(resp.items.length));
    } finally {
      setIsLoadingMoreAdGroups(false);
    }
  }, [adGroupsPage, adGroupsSearch, adGroupsHasMore, isLoadingMoreAdGroups]);

  return {
    applications,
    adGroups,

    isLoadingApplications,
    isLoadingAdGroups,

    isLoadingMoreApplications,
    isLoadingMoreAdGroups,

    applicationsHasMore,
    adGroupsHasMore,

    searchApplications,
    searchAdGroups,

    loadMoreApplications,
    loadMoreAdGroups,
  };
};
