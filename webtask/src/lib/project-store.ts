"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ProjectSelectionState = {
  projectId: string | null; // null = all projects
  setProjectId: (id: string | null) => void;
};

export const useProjectStore = create<ProjectSelectionState>()(
  persist(
    (set) => ({
      projectId: null,
      setProjectId: (id) => set({ projectId: id }),
    }),
    { name: "webtask.projectSelection.v1" },
  ),
);

