import { useState } from "react";
import { Label, TextInput } from "flowbite-react";
import { inputTheme } from "../../theme";
import { FaSearch } from "react-icons/fa";

function FolderPicker({setOpen, folders, setSelectedFolder}) {
    const [searchQuery, setSearchByQuery] = useState("");
    return (
        <div className={`bg-white rounded-lg shadow w-60`}>
            <div className="p-3">
                {/* Header */}
                <div className="border-b-1 border-gray-500 mb-4">
                    <TextInput placeholder="Search folders" icon={FaSearch} theme={inputTheme} onChange={(e) => {setSearchByQuery(e.target.value)}} />
                </div>
                {/* List of folders */}
                <div className="max-h-36 overflow-y-auto">
                    {folders
                        .filter((folder) =>
                        folder.name.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((folder, idx) => (
                        <div 
                        key={idx} 
                        className="py-2 ps-2 rounded hover:bg-gray-100 cursor-pointer"
                        onClick={() => {setSelectedFolder(folder); setOpen(false)}}>
                            <Label>{folder.name}</Label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default FolderPicker;