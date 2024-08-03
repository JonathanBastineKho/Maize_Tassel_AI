import { Modal, Button, Spinner } from "flowbite-react";
import { spinnerTheme } from "../../theme";
import { IoWarningOutline } from "react-icons/io5";

function WarningDelete({ open, setOpen, setItemToDelete, loading, deleteItem }){
    return (
        <Modal
        show={open}
        size="md"
        onClose={() => {
            setItemToDelete(null);
            setOpen(false);
        }}
        popup
        >
        <Modal.Body className="mt-10">
            <div className="text-center">
            <div className="mb-4 bg-red-200 rounded-full p-2.5 w-fit mx-auto">
                <IoWarningOutline className="mx-auto h-10 w-10 text-red-600" />
            </div>
            <h3 className="mb-3 text-lg font-semibold text-gray-800">
                Are you sure to remove this?
            </h3>
            <h3 className=" mx-auto mb-5 text-md w-4/5 text-gray-500 font-normal">
                This action cannot be undone. All data associated with this item will be lost.
            </h3>
            <div className="flex flex-col justify-center gap-4">
                <Button color="failure" onClick={deleteItem} disabled={loading}>
                {loading ? (
                    <div className="flex items-center">
                    <Spinner
                        aria-label="Spinner button example"
                        size="sm"
                        theme={spinnerTheme}
                    />
                    <span className="pl-3">Loading...</span>
                    </div>
                ) : (
                    "Yes I'm Sure"
                )}
                </Button>
                <Button
                color="gray"
                onClick={() => {
                    setItemToDelete(null);
                    setOpen(false);
                }}
                >
                No, cancel
                </Button>
            </div>
            </div>
        </Modal.Body>
        </Modal>
    );
}

export default WarningDelete;