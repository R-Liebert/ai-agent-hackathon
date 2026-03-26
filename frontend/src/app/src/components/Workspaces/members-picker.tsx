import * as React from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import parse from "autosuggest-highlight/parse";
import { debounce } from "@mui/material/utils";
import { CircularProgress, FormLabel, Paper, Typography } from "@mui/material";
import { FiChevronDown } from "react-icons/fi";
import { UserDto } from "../../models/workspace-model";
import { usersService } from "../../services/usersService";
import { IoPersonCircleSharp } from "react-icons/io5";
import EntraIdUserProfilePicture from "./entraid-user-profile-picture";

type MembersPickerProps = {
  label: string;
  placeholder: string;
  value?: UserDto[];
  onChange?: (value: UserDto[]) => void;
};

const MembersPicker = ({
  label,
  placeholder,
  value,
  onChange,
}: MembersPickerProps) => {
  const [inputValue, setInputValue] = React.useState("");
  const [options, setOptions] = React.useState<readonly UserDto[]>([]);

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const minNumberOfChars = 3;

  const getMembers = (
    request: { input: string },
    callback: (results?: readonly UserDto[]) => void
  ) => {
    if (callback) {
      if (loading || request?.input?.length < minNumberOfChars) {
        callback(options);
      }

      setLoading(true);

      usersService
        .searchUsersInEntraID(request.input)
        .then((options) => {
          callback(options);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const fetch = React.useMemo(
    () =>
      debounce(
        (
          request: { input: string },
          callback: (results?: readonly UserDto[]) => void
        ) => {
          getMembers(request, callback);
        },
        400
      ),
    []
  );

  React.useEffect(() => {
    let active = true;

    if (inputValue === "") {
      setOptions(value ? value : []);
      return undefined;
    }

    fetch({ input: inputValue }, (results?: readonly UserDto[]) => {
      if (active) {
        let newOptions: readonly UserDto[] = [];

        if (value) {
          newOptions = value;
        }

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        if (value) {
          const selectedValues = value ? value.map((x) => x.id) : [];
          newOptions = newOptions.filter(
            (x) => selectedValues.indexOf(x.id) == -1
          );
        }

        setOptions(newOptions);
      }
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, fetch]);

  React.useEffect(() => {
    if (!open) {
      setOptions([]);
    }
  }, [open]);

  const onChangeIntl = (newState: UserDto[]) => {
    if (onChange) {
      onChange(newState ?? []);
      setOptions([]);
    }
  };

  return (
    <>
      <FormLabel className="!font-body !text-md !w-full !text-white-100 mt-10 mb-2">
        {label}
      </FormLabel>
      <Autocomplete
        className="members-picker"
        data-testid="members-picker"
        filterOptions={(x) => x}
        options={options}
        autoComplete
        multiple
        includeInputInList
        filterSelectedOptions
        value={value}
        fullWidth
        noOptionsText=""
        loading={loading}
        disableClearable
        getOptionKey={(option) => option?.id}
        getOptionLabel={(option) => `${option ? option.displayName : ""}`}
        isOptionEqualToValue={(option, value) => option?.id == value?.id}
        onOpen={() => {
          setOpen(true);
        }}
        onClose={() => {
          setOpen(false);
        }}
        onChange={(_: any, newValue) => {
          if (newValue) {
            const newValueIds = newValue.map((x) => x.id);
            let newOptions = [...options].filter(
              (x) => newValueIds.indexOf(x.id) == -1
            );
            setOptions(newOptions);
          } else {
            setOptions(options);
          }
          onChangeIntl(newValue);
        }}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        renderTags={() => null}
        PaperComponent={({ children }) => {
          if (inputValue?.length == 0) {
            return null;
          }
          return (
            <Paper
              style={{
                backgroundColor: "#292929",
                color: "#DEDEDE!important",
                marginTop: "10px",
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                border: "2px solid #3A3A3D",
              }}
            >
              {options.length === 0 && !loading && (
                <Typography className="!text-gray-300 pl-4 pt-4 -transform-y-2">
                  No records found
                </Typography>
              )}
              {loading ? (
                <div className="flex place-items-center w-full place-content-center h-[4em]">
                  <CircularProgress
                    sx={{ color: "white", marginX: "auto" }}
                    size={32}
                  />
                </div>
              ) : (
                children
              )}
            </Paper>
          );
        }}
        renderInput={(params) => (
          <TextField
            placeholder={placeholder}
            {...params}
            onKeyDownCapture={(event: React.KeyboardEvent) => {
              if (event.key !== "Backspace") {
                return;
              }

              const target = event.target as HTMLInputElement | null;
              if (!target || target.value.length > 0) {
                return;
              }

              // Prevent MUI Autocomplete from removing selected members
              // when Backspace is pressed on an empty search input.
              event.preventDefault();
              event.stopPropagation();
            }}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  <FiChevronDown
                    className={`text-white-100 text-2xl ml-auto absolute right-4 top-5 transition-transform duration-300 ease-out ${
                      open ? "rotate-180" : ""
                    }`}
                    strokeWidth={2}
                  />
                </React.Fragment>
              ),
              className:
                " !rounded-xl !text-white-100 !font-body !text-md !outline-none !bg-transparent !focus:border-white-100 !focus:outline-none  !py-3 !px-4",
            }}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#3A3A3D",
                  borderWidth: "1.8px",
                },
                "&:hover fieldset": {
                  borderColor: "#DEDEDE",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#DEDEDE",
                },
              },
            }}
          />
        )}
        renderOption={(props, option) => {
          const { ...optionProps } = props;

          if (!option) {
            return null;
          }

          const matches: [number, number][] = [];

          const parts = parse(
            option.displayName,
            matches.map((match: any) => [
              match.offset,
              match.offset + match.length,
            ])
          );

          return (
            <li
              className="bg-gray-700 mt-1 p-4 !hover:bg-black flex items-center"
              {...optionProps}
              key={option.id}
              style={{
                transition: "background-color 0.3s",
                color: "#DEDEDE",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLLIElement).style.backgroundColor =
                  "#424242"; // Darker color on hover
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLLIElement).style.backgroundColor =
                  "transparent"; // Reset to default color
              }}
            >
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10">
                <EntraIdUserProfilePicture
                  user={option}
                  fallback={
                    <IoPersonCircleSharp className="!text-white-100 text-3xl" />
                  }
                />
              </div>
              <div className="ml-3 flex-1 overflow-hidden">
                {parts.map((part, index) => (
                  <span className="text-white-100 !text-md" key={index}>
                    {part.text}
                  </span>
                ))}
                <p className="text-gray-300 text-sm uppercase">
                  {option.email}
                </p>
              </div>
            </li>
          );
        }}
      />
    </>
  );
};

export default MembersPicker;
