export const LoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center h-64 gap-4">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
      <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
    </div>
    <p className="text-sm text-slate-500 font-medium">{message}</p>
  </div>
);