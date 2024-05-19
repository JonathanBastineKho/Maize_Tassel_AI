import React from "react";
import { useLocation } from "react-router-dom";

function ErrorPage({}) {
  let loc = useLocation();
  return (
  <>
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <div className="text-center">
        <div className="flex justify-center">
        <img
          className="object-contain h-32 justify-center"
          src="https://storage.googleapis.com/corn_sight_public/404.png"
        />
        </div>
        <h1 className="text-6xl font-semibold text-gray-700 text-center ">404</h1>
        <p className="text-gray-500 mt-4">
          Sorry, the page "{loc.pathname}" does not exist.
        </p>
        <a href="/" className="text-blue-500 hover:underline mt-4">
          Go back to home page
        </a>
      </div>
    </div>
    </>
  );
}

export default ErrorPage;
