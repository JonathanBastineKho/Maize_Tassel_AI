import React from "react";
import UserNewFolderModal from "../Components/User/UserNewFolderModal";
import SuspendAccountModal from "../Components/Admin/SuspendAccountModal";
import { useState } from "react";
import { Button } from "flowbite-react";

function TestPage({}) {
  const [state, setState] = useState(false);
  const dummyAccount = {
    email: "john@uow.edu.au",
    firstName: "John",
    lastName: "Doe"
  }
  return (
    <>
      <Button onClick={() => setState(true)}>Open Modal</Button>
      <SuspendAccountModal state={state} setState={setState} email={dummyAccount.email} firstName={dummyAccount.firstName} lastName={dummyAccount.lastName}/>
    </>
  );
}

export default TestPage;
