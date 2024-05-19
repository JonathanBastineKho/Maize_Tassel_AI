import { Button, TextInput } from "flowbite-react";
import { HiSearch } from "react-icons/hi";
import { FaTrashAlt } from "react-icons/fa";
import { FaFilter, FaPlus, FaFolderPlus } from "react-icons/fa6";
import { inputTheme } from "../../Components/theme";

function AdminUsersPage() {
  return (
    <div className="px-5 mt-24 flex flex-col gap-5">
      <h2 className="font-bold text-2xl">All users</h2>
      <div className="flex flex-wrap flex-row justify-between">
        <div className="flex flex-row items-center gap-4">
          <TextInput
            className="w-96"
            placeholder="Search your image"
            icon={HiSearch}
            theme={inputTheme}
          />
          <div className="flex flex-row gap-1">
            <button className="hover:bg-gray-100 p-2 rounded-md">
              <FaTrashAlt className="w-5 h-5 text-gray-500" />
            </button>
            <button className="hover:bg-gray-100 p-2 rounded-md">
              <FaFilter className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUsersPage;
