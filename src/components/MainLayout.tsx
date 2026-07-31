"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main
        style={{
          marginRight: "240px",
          flex: 1,
          padding: "24px",
          backgroundColor: "#0f1117",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
    </div>
  );
}
