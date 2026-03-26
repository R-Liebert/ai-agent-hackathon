import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Paper, Button, Avatar, Chip } from "@mui/material";
import { WorkspaceMemberDto } from "../../../../services/admin/types/adminWorkspace.types";
import { useAdminSharePointApi, AdminGraphUserBasic } from "../../../../services/admin/adminSharePointService";

type WorkspaceMembersProps = {
  members: WorkspaceMemberDto[];
  hasMore?: boolean;
  continuationToken?: string;
  onLoadMore: (continuationToken?: string) => void;
};

const WorkspaceMembers: React.FC<WorkspaceMembersProps> = ({ members, hasMore, continuationToken, onLoadMore }) => {
  const { getUsersBasic, getUserPhoto } = useAdminSharePointApi();
  const userIds = useMemo(() => (members || []).map(m => m.userId).filter(Boolean), [members]);
  const [userMap, setUserMap] = useState<Map<string, AdminGraphUserBasic | Error>>(new Map());
  const [photoMap, setPhotoMap] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let isCancelled = false;
    const run = async () => {
      try {
        const map = await getUsersBasic(userIds);
        if (!isCancelled) setUserMap(map);
      } catch {
      }
    };
    if (userIds.length > 0) run();
    return () => { isCancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIds]);

  useEffect(() => {
    let isCancelled = false;
    const fetchPhotos = async () => {
      const entries = await Promise.all(userIds.map(async (id) => [id, await getUserPhoto(id, 48)] as const));
      if (!isCancelled) {
        const map: Record<string, string | null> = {};
        for (const [id, dataUrl] of entries) map[id] = dataUrl;
        setPhotoMap(map);
      }
    };
    if (userIds.length > 0) fetchPhotos();
    return () => { isCancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIds]);

  const getDisplayName = (userId: string): string => {
    const u = userMap.get(userId);
    if (u && !(u instanceof Error)) return u.displayName || u.mail || u.userPrincipalName || userId;
    return userId;
  };

  return (
    <Box>
      <Typography variant="h6" className="text-white-100" sx={{ mb: 2 }}>
        Members ({members.length})
      </Typography>
      <Paper sx={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 2, p: 3 }}>
        <Box mt={1} sx={{ maxHeight: 480, overflow: "auto" }}>
          {members.map(m => (
            <Box key={m.userId} display="flex" alignItems="center" gap={1.5} sx={{ py: 0.75 }}>
              <Avatar
                src={photoMap[m.userId] || undefined}
                alt={getDisplayName(m.userId)}
                sx={{ width: 32, height: 32, fontSize: 14, bgcolor: "#2a2a2a" }}
              >
                {!photoMap[m.userId] ? (getDisplayName(m.userId).slice(0,1).toUpperCase()) : null}
              </Avatar>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" className="text-white-100">{getDisplayName(m.userId)}</Typography>
                {m.isOwner && (
                  <Chip label="Admin" size="small" sx={{ height: 20, bgcolor: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.35)" }} />
                )}
              </Box>
            </Box>
          ))}
        </Box>
        {hasMore && (
          <Box mt={2}>
            <Button
              variant="outlined"
              onClick={() => onLoadMore(continuationToken)}
              sx={{ borderColor: "#2a2a2a", color: "EDEDED", "&:hover": { backgroundColor: "#262626", borderColor: "#3a3a3a" } }}
            >
              Load more members
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default WorkspaceMembers;


