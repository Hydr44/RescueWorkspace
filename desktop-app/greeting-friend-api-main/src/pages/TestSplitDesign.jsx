// src/pages/TestSplitDesign.jsx
// Pagina di test per il nuovo design split
import ShellSplit from "../components/ShellSplit";
import DashboardSplit from "./DashboardSplit";

export default function TestSplitDesign() {
  return (
    <ShellSplit>
      <DashboardSplit />
    </ShellSplit>
  );
}
