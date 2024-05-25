import {
  Modal,
  Label,
  TextInput,
  Textarea,
  Button,
  Spinner,
  Progress,
} from "flowbite-react";

import { useState, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";

function UserNewFolderModal({ state, setState }) {
  const folderNameRef = useRef();

  function onCloseModal() {
    setState(false);
  }

  function handleCreateFolder() {
    const folderName = folderNameRef.current.value;

    axios
      .post("api/service/create-folder", {
        folder_name: folderName,
        parent_id: null,
      })
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  return (
    <>
      <Modal className="" show={state} onClose={onCloseModal} size="md" popup>
        <FaTimes
          className="absolute top-0 right-0 m-2 rounded-md w-5 h-5 cursor-pointer"
          onClick={onCloseModal}
        />
        <div className="p-4">
          <section className="flex flex-row">
            <h2 className="text-2xl font-semibold mb-4">New Folder</h2>
          </section>
          <TextInput
            className="mb-4"
            placeholder="Enter folder name"
            ref={folderNameRef}
          />
          <section className="flex flex-row justify-end gap-5 pt-1">
            <Button
              onClick={() => setState(false)}
              className="bg-primary_green enabled:hover:bg-enabled_green"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              className="bg-primary_green enabled:hover:bg-enabled_green"
            >
              Create
            </Button>
          </section>
        </div>
      </Modal>
    </>
  );
}
export default UserNewFolderModal;
