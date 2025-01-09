// src/components/LoadingSpinner.tsx
export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-200" />
    </div>
  );
}
