import React from "react";
export const RenderRegularRoleTag = () => {
  return (
    <span className="inline-block bg-gray-400 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">
      Regular
    </span>
  );
};
export const RenderPremiumRoleTag = () => {
  return (
    <span className="inline-block bg-green-700 rounded-full px-3 py-1 text-sm font-semibold text-green-100 mr-2">
      Premium
    </span>
  );
};
export const RenderAdminRoleTag = () => {
  return (
    <span className="inline-block bg-yellow-300 rounded-full px-3 py-1 text-sm font-semibold text-yellow-800 mr-2">
      Admin
    </span>
  );
};
export const RenderVerifiedRoleTag = () => {
  return (
    <span className="inline-block bg-green-200 rounded-full px-3 py-1 text-sm font-semibold text-green-700 mr-2">
      Verified
    </span>
  );
};
export const RenderUnVerifiedRoleTag = () => {
  return (
    <span className="inline-block bg-red-200 rounded-full px-3 py-1 text-sm font-semibold text-red-700 mr-2">
      Unverified
    </span>
  );
};
export const RenderSubscriptionText = () => {
  return (
    <div className="flex flex-row items-end">
      <h1 className="">Next Payment will be on 24/03/2003</h1>
    </div>
  );
};

export const RenderSuspendedText = () => {
  return (
    <div className="flex flex-row gap-2 items-center">
      <span className="inline-block bg-red-500 rounded-full px-3 py-1 text-sm font-semibold text-black mr-2">
        Suspended
      </span>
    </div>
  );
};
