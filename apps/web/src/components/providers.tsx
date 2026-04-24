"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "./ui";

export function AppProviders(props: { children: ReactNode }) {
  return <ToastProvider>{props.children}</ToastProvider>;
}
