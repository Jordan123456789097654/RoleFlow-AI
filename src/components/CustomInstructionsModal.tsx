"use client";

import React from "react";
import { SettingsModal } from "./SettingsModal";
import { UserProfile, UsageStats } from "@/types";

interface CustomInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdate: (updated: UserProfile) => void;
  usage?: UsageStats;
}

export const CustomInstructionsModal: React.FC<CustomInstructionsModalProps> = (props) => {
  return <SettingsModal {...props} />;
};

export { SettingsModal };
