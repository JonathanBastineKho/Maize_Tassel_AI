import React from "react";
import UserNewFolderModal from "../Components/User/UserNewFolderModal";
import { useState } from "react";
import { Button } from "flowbite-react";

function TestPage({}) {
  const [state, setState] = useState(false);

  return (
    <>
      <Button onClick={() => setState(true)}>Open Modal</Button>
      <UserNewFolderModal state={state} setState={setState} />
    </>
  );
}

export default TestPage;
