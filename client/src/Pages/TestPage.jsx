import React from "react";
import AdminViewUserAccountModal from "../Components/Admin/AdminViewUserAccountModal";
import { useState } from "react";
import { Button } from "flowbite-react";
import SuspendAccountModal from "../Components/Admin/SuspendAccountModal";
import RenameFolderModal from "../Components/User/RenameFolderModal";
import RenameImageModal from "../Components/User/RenameImageModal";

function TestPage({}) {
  const [state, setState] = useState(false);
  const email = "jovanjoto24@gmail.com";
  return (
    <>
      <Button onClick={() => setState(true)}>Open Modal</Button>
      <RenameImageModal state={state} setState={setState} folderName={email} folderId={1} imageName={"abc"} imageDescription={"abc"}/>
    </>
  );
}

export default TestPage;
