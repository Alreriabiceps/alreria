import React, { useEffect } from "react";
import { toast } from "react-toastify";

const ApprovalStatus = ({ isApproved, isActive }) => {
  // Clear any existing notifications when component mounts
  useEffect(() => {
    // Clear any existing notifications to start fresh
    toast.dismiss("account-pending");
    toast.dismiss("account-deactivated");
    toast.dismiss("account-approved");
  }, []);

  // Show notifications based on current status
  useEffect(() => {
    if (!isActive) {
      toast.error(
        "Your account has been deactivated. Please contact an administrator.",
        {
          toastId: "account-deactivated",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
        }
      );
    } else if (!isApproved) {
      toast.warning(
        "Your account is pending admin approval. You can browse but cannot participate in activities.",
        {
          toastId: "account-pending",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
        }
      );
    } else {
      // Clear any existing approval notifications when approved
      toast.dismiss("account-pending");
      toast.dismiss("account-deactivated");

      // Show success notification briefly
      toast.success(
        "Your account is fully approved! You can participate in all activities.",
        {
          toastId: "account-approved",
          autoClose: 5000,
        }
      );
    }
  }, [isApproved, isActive]);

  // Don't render persistent banners anymore
  return null;
};

export default ApprovalStatus;
