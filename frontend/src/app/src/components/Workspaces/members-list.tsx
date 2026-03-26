import { Chip, FormControlLabel, Switch } from "@mui/material";
import { TbTrash } from "react-icons/tb";
import { WorkspaceMemberDto } from "../../models/workspace-model";
import EntraIdUserProfilePicture from "./entraid-user-profile-picture";
import { styled } from "@mui/material/styles";

type WorkspaceMembersListProps = {
  members?: WorkspaceMemberDto[];
  onChange: (members: WorkspaceMemberDto[]) => void;
};

const WorkspaceMembersList = ({
  members,
  onChange,
}: WorkspaceMembersListProps) => {
  const handleDeleteTag = (tagToDelete: WorkspaceMemberDto) => {
    onChange(members ? members.filter((tag) => tag.id !== tagToDelete.id) : []);
  };

  const handleMakeAdminChanged = (
    tagToUpdate: WorkspaceMemberDto,
    checked: boolean
  ) => {
    const newState = members?.map((tag) => {
      if (tag.id == tagToUpdate.id) {
        tag.isOwner = checked;
      }
      return tag;
    });
    onChange(newState ?? []);
  };

  const AntSwitch = styled(Switch)(({ theme }) => ({
    width: 32,
    height: 18,
    padding: 0,
    display: "flex",
    "&:active": {
      "& .MuiSwitch-thumb": {
        width: 18,
      },
      "& .MuiSwitch-switchBase.Mui-checked": {
        transform: "translateX(8px)",
      },
    },
    "& .MuiSwitch-switchBase": {
      padding: 0,
      color: "#2b2b2b",
      "&.Mui-checked": {
        transform: "translateX(15px)",
        color: "#fff",
        "& + .MuiSwitch-track": {
          opacity: 1,
          backgroundColor: "#89898e",
          ...theme.applyStyles("dark", {
            backgroundColor: "#177ddc",
          }),
        },
      },
    },
    "& .MuiSwitch-thumb": {
      boxShadow: "0 2px 4px 0 rgb(0 35 11 / 20%)",
      width: 17,
      height: 17,
      borderRadius: 50,
      transition: theme.transitions.create(["width"], {
        duration: 300,
      }),
    },
    "& .MuiSwitch-track": {
      borderRadius: 50,
      opacity: 1,
      backgroundColor: "rgba(83,83,83,1)",
      boxSizing: "border-box",
      ...theme.applyStyles("dark", {
        backgroundColor: "rgba(255,255,255,.35)",
      }),
    },
  }));

  return (
    <>
      {/* tags beneath the input */}
      <div className="w-full flex flex-wrap my-4 gap-3">
        {members?.map((option, index) => (
          <Chip
            key={`member_${option?.id || index}`}
            className="!w-full !place-items-center !place-content-center !justify-between !bg-gray-600 !text-white-100 !font-body !text-[14px] !font-medium !h-12 !px-2 !rounded-lg"
            label={
              <div className="!w-full flex !place-items-center !place-content-center">
                <div className="flex gap-3 !w-auto !place-items-center !place-content-center">
                  <div>
                    <EntraIdUserProfilePicture
                      user={option}
                      fallback={
                        <div className="w-6 h-6 rounded-full bg-white-100 flex items-center justify-center text-gray-600 !font-bold text-lg !font-headers">
                          {option.displayName?.charAt(0)?.toUpperCase()}
                        </div>
                      }
                    />
                  </div>
                  <span>{option?.displayName}</span>
                  <span className="!uppercase">{`<${option?.email}>`}</span>
                </div>
                <div className="absolute right-14 top-[6px] bg-gray-400 pl-4 pr-[1px] !py-0 rounded-full ">
                  <FormControlLabel
                    sx={{ color: "#fff" }}
                    control={
                      <AntSwitch
                        sx={{ m: 1 }}
                        checked={option.isOwner}
                        onChange={(e) => {
                          handleMakeAdminChanged(option, e.target.checked);
                        }}
                      />
                    }
                    label={
                      <span className="!text-white-100 !font-body !text-[15px] !font-medium">
                        Make Admin
                      </span>
                    }
                  />
                </div>
              </div>
            }
            onDelete={() => handleDeleteTag(option)}
            deleteIcon={
              <TbTrash
                strokeWidth={1.4}
                size={24}
                className="!text-white-100 !mr-2"
              />
            }
          />
        ))}
      </div>
    </>
  );
};

export default WorkspaceMembersList;
