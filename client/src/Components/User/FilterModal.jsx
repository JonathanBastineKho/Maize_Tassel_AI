import { Modal, Label, Button, Datepicker, TextInput } from "flowbite-react";
import { useState } from "react";
import { format } from "date-fns";

function FilterModal({ filter, open, setOpen }) {
    const [loading, setLoading] = useState(false);

    const closeModal = () => {
        setLoading(false);
        setOpen(false);
    };

    const [dateStart, setDateStart] = useState(new Date());
    const [dateEnd, setDateEnd] = useState(new Date());
    const handleChangeStartDate = (date) => {
        setDateStart(date);
        if (dateEnd < date) {
            setDateEnd(date);
        };
    };

    const handleChangeEndDate = (date) => {
        setDateEnd(date);
        if (dateStart > date) {
            setDateStart(date);
        };
    };

    const formatDate = (date) => {
        return date ? format(date, 'EEE MMM dd yyyy') : '';
    };

    return (
        <Modal
            show={open}
            onClose={closeModal}
            size="md"
        >
            <Modal.Header>Filter Images</Modal.Header>
            <Modal.Body>
            <form id="image_filter" className="flex flex-col gap-2">
                <Label className="items-center flex">
                    Processing Status:
                </Label>
                <Button.Group id="processing_status">
                    <Button
                    value="all"
                    color={"blue"}
                    className={
                        filter.processing_status === "all"
                        ? "hover:text-white bg-black outline outline-1"
                        : "text-black bg-white outline outline-1"
                    }
                    // onClick={() =>
                    //     handleChange("processing_status", "all")
                    // }
                    >
                    All
                    </Button>
                    <Button
                    value="in_queue"
                    color={"blue"}
                    className={
                        filter.processing_status === "in_queue"
                        ? "hover:text-white bg-black outline outline-1"
                        : "text-black bg-white outline outline-1"
                    }
                    // onClick={() =>
                    //     handleChange("processing_status", "in_queue")
                    // }
                    >
                    In Queue
                    </Button>
                    <Button
                    value="processing"
                    color={"blue"}
                    className={
                        filter.processing_status === "processing"
                        ? "hover:text-white bg-black outline outline-1"
                        : "text-black bg-white outline outline-1"
                    }
                    // onClick={() =>
                    //     handleChange("processing_status", "processing")
                    // }
                    >
                    Processing
                    </Button>
                    <Button
                    value="processed"
                    color={"blue"}
                    className={
                        filter.processing_status === "processed"
                        ? "hover:text-white bg-black outline outline-1"
                        : "text-black bg-white outline outline-1"
                    }
                    // onClick={() =>
                    //     handleChange("processing_status", "processed")
                    // }
                    >
                    Processed
                    </Button>
                </Button.Group>
                <Label className="items-center flex">
                    Upload Date:
                </Label>
                <div className="flex">
                    <Datepicker
                        value={formatDate(dateStart)}
                        defaultDate={new Date()}
                        selectedDate={dateStart}
                        onSelectedDateChanged={handleChangeStartDate}
                        minDate={new Date(2000, 0, 1)}
                        maxDate={new Date()}
                    />
                    <Label className="p-2">to</Label>
                    <Datepicker
                        value={formatDate(dateEnd)}
                        defaultDate={new Date()}
                        selectedDate={dateEnd}
                        onSelectedDateChanged={handleChangeEndDate}
                        minDate={new Date(2000, 0, 1)}
                        maxDate={new Date()}
                    />
                </div>
                <Label className="items-center flex">
                    Size (in MB)
                </Label>
                <div className="flex">
                    <TextInput placeholder="Minimum size"></TextInput>
                    <Label className="p-2">to</Label>
                    <TextInput placeholder="Maximum size"></TextInput>
                </div>
                <Label className="items-center flex">
                    Width (in pixels)
                </Label>
                <div className="flex">
                    <TextInput placeholder="Minimum width"></TextInput>
                    <Label className="p-2">to</Label>
                    <TextInput placeholder="Maximum width"></TextInput>
                </div>
                <Label className="items-center flex">
                    Height (in pixels)
                </Label>
                <div className="flex mb-3">
                    <TextInput placeholder="Minimum height"></TextInput>
                    <Label className="p-2">to</Label>
                    <TextInput placeholder="Maximum height"></TextInput>
                </div>
                <div className="flex flex-row gap-3">
                    <Button
                        className="bg-gray-500 focus:ring-4 focus:ring-gray-500 enabled:hover:bg-gray-700 items-center flex"
                        onClick={closeModal}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-700 items-center flex"
                        style={{ marginLeft: "auto" }}
                    >
                        Confirm
                    </Button>
                </div>
            </form>
            </Modal.Body>
        </Modal>
    );
}

export default FilterModal;