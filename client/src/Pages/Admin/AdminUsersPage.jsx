// Dependencies
import { TextInput } from "flowbite-react";
import { HiSearch } from "react-icons/hi";
import { FaTrashAlt, FaCheck } from "react-icons/fa";
import { FaFilter } from "react-icons/fa6";
import { inputTheme } from "../../Components/theme";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";

// Local Imports
import AdminUsersTable from "../../Components/Admin/AdminUsersTable";
import AdminViewUserAccountModal from "../../Components/Admin/AdminViewUserAccountModal";
import ToastMsg from "../../Components/Other/ToastMsg";
import CancelSubscriptionModal from "../../Components/Admin/CancelSubscriptionModal";

function AdminUsersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchValue = searchParams.get("search") || "";

  const [viewAccountModalOpen, setViewAccountModalOpen] = useState(false);
  const [suspendAccountModalOpen, setSuspendAccountModalOpen] = useState(false);
  const [cancelSubAccountModalOpen, setCancelSubAccountModalOpen] = useState(false);
  const [userToAction, setUserToAction] = useState({});
  const [inputValue, setInputValue] = useState(searchValue);

  // Toast Message
  const [successSuspend, setSuccessSuspend] = useState(false);
  const [successCancelSub, setSuccessCancelSub] = useState(false);

  const timeoutRef = useRef(null);
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      navigate(`/admin/users?search=${value}`);
    }, 400);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      navigate(`/admin/users?search=${inputValue}`);
    }
  };

  return (
    <div className="px-5 mt-24 flex flex-col gap-5">
      <ToastMsg color="green" icon={<FaCheck className="h-5 w-5" />} open={successSuspend} setOpen={setSuccessSuspend} message="User Successfully suspended" />
      <ToastMsg color="green" icon={<FaCheck className="h-5 w-5" />} open={successCancelSub} setOpen={setSuccessCancelSub} message="User's subscription successfully cancelled" />
      <AdminViewUserAccountModal
        state={viewAccountModalOpen}
        setState={setViewAccountModalOpen}
        userToView={userToAction}
        setSuspendAccountModalOpen={setSuspendAccountModalOpen}
        setCancelSubAccountModalOpen={setCancelSubAccountModalOpen}
      />
      <CancelSubscriptionModal
        open={cancelSubAccountModalOpen}
        setOpen={setCancelSubAccountModalOpen}
        userToCancel={userToAction}
        setUserToCancel={setUserToAction}
        setSuccessCancelSub={setSuccessCancelSub}
      />
      <h2 className="font-bold text-2xl">All users</h2>
      <div className="flex flex-wrap flex-row justify-between">
        <div className="flex flex-row items-center gap-4">
          <TextInput
            className="w-96"
            placeholder="Search users"
            icon={HiSearch}
            theme={inputTheme}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <div className="flex flex-row gap-1">
            <button
              className="hover:bg-gray-100 p-2 rounded-md"
              onClick={() => {
                navigate("/admin/users");
                setInputValue("");
              }}
            >
              <FaTrashAlt className="w-5 h-5 text-gray-500" />
            </button>
            <button className="hover:bg-gray-100 p-2 rounded-md">
              <FaFilter className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
      <AdminUsersTable
        userToAction={userToAction}
        setUserToAction={setUserToAction}
        setViewAccountModalOpen={setViewAccountModalOpen}
        setSuspendAccountModalOpen={setSuspendAccountModalOpen}
        suspendAccountModalOpen={suspendAccountModalOpen}
        setCancelSubAccountModalOpen={setCancelSubAccountModalOpen}
        setSuccessSuspend={setSuccessSuspend}
      />
    </div>
  );
}

export default AdminUsersPage;
