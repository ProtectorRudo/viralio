import {createRoot} from "react-dom/client";
import LaUltimaJugada from "../src/app/la-ultima-jugada/LaUltimaJugada";

const root=document.getElementById("ultima-jugada-root");
if(!root)throw new Error("Missing football escape mount point");
createRoot(root).render(<LaUltimaJugada/>);
