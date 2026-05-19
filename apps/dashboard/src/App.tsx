import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminApp } from './components/Admin/AdminApp.js';
import { KioskApp } from './components/Kiosk/KioskApp.js';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<KioskApp />} />
      </Routes>
    </BrowserRouter>
  );
}
