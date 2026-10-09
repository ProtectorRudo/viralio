"use client";
import React from "react";
import { createRoot } from "react-dom/client";
import EscapeGame from "./EscapeGame";
const node = document.getElementById("escape-root");
if (!node) throw new Error("UMBRAL root is missing");
createRoot(node).render(<EscapeGame/>);
