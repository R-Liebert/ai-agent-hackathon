import { FiSearch } from "react-icons/fi";
import { useState } from "react";

type SearchInputProps = {
  placeholder?: string;
  onSearch: (input: string) => void;
  isNarrow?: boolean;
};

const SearchInputField = ({
  placeholder = "Search...",
  onSearch,
  isNarrow,
}: SearchInputProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="relative w-full flex items-center justify-center my-8 md:my-12">
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        className={`w-full ${
          isNarrow ? "px-4 py-3" : "p-4 "
        } pl-12 rounded-2xl !bg-gray-650 text-white-100 border-2 border-gray-500 outline-none hover:border-white-100 focus:border-white-100 focus:outline-none font-body placeholder-[#fff] placeholder-opacity-50`}
        onChange={handleInputChange}
      />
      <FiSearch
        className={`absolute ${
          isNarrow ? "top-[14px]" : "top-[18px]"
        }  left-4 text-white-100 text-xl`}
      />
    </div>
  );
};

export default SearchInputField;
