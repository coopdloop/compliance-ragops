// src/components/LogoutButton.tsx

import { useAuth } from "@/providers/AuthProvider";

export function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      onClick={() => logout()}
      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-100"
    >
      Log Out
    </button>
  );
}
