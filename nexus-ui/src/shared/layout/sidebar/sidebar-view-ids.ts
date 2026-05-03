export const SIDEBAR_VIEW_ID = {
  CHANNELS: "channels",
  DMS: "dms",
  FILES: "files",
  SETTINGS: "settings",
} as const;

export type SidebarView = (typeof SIDEBAR_VIEW_ID)[keyof typeof SIDEBAR_VIEW_ID];
