// src/AppRoutes.tsx
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Scans from './pages/Scans';
import Documents from './pages/Documents';
import Settings from './pages/Settings';

export default function AppRoutes() {
  return (
    <div className="text-gray-100">
      <main className="p-2">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scans" element={<Scans />} />
          <Route path="/documents" element={<Documents />} />S
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
