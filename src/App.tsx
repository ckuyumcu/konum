import { Routes, Route, Navigate } from "react-router";
import { Toaster } from "sonner";
import Landing from "./pages/Landing";
import Giris from "./pages/Giris";
import WorkspaceList from "./pages/WorkspaceList";
import KurulumSihirbazi from "./pages/KurulumSihirbazi";
import AppShell from "./app/AppShell";
import Bellek from "./pages/Bellek";
import KilitliModul from "./pages/KilitliModul";
import KanitMotoru from "./pages/KanitMotoru";
import Icra from "./pages/Icra";
import Onay from "./pages/Onay";
import Teshis from "./pages/Teshis";
import Ayarlar from "./pages/Ayarlar";
import Konsol from "./pages/Konsol";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/giris" element={<Giris />} />
        <Route path="/teshis" element={<Teshis />} />
        <Route path="/app" element={<WorkspaceList />} />
        <Route path="/app/yeni" element={<KurulumSihirbazi />} />
        <Route path="/app/konsol" element={<Konsol />} />
        <Route path="/app/:workspaceId" element={<AppShell />}>
          <Route index element={<Navigate to="bellek" replace />} />
          <Route path="bellek" element={<Bellek />} />
          <Route path="kanit" element={<KanitMotoru />} />
          <Route path="icra" element={<Icra />} />
          <Route path="onay" element={<Onay />} />
          <Route path="radar" element={<KilitliModul modul="radar" />} />
          <Route path="ayarlar" element={<Ayarlar />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="bottom-right" toastOptions={{ style: { fontSize: "15px" } }} />
    </>
  );
}
