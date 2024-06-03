import React from "react";
import AdminViewUserAccountModal from "../Components/Admin/AdminViewUserAccountModal";
import { useState } from "react";
import { Button } from "flowbite-react";
import SuspendAccountModal from "../Components/Admin/SuspendAccountModal";

function TestPage({}) {
  const [state, setState] = useState(false);
  const email = "jovanjoto24@gmail.com";
  return (
    <>
      <Button onClick={() => setState(true)}>Open Modal</Button>
      <SuspendAccountModal state={state} setState={setState} email={email} />
    </>
  );
}

export default TestPage;
