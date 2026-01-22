// app/(auth)/reset-password/page.jsx
import ResetPasswordPageContent from './ResetPasswordPageContent';
import { Suspense } from 'react';

function ResetPasswordPageWrapper() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen overflow-hidden relative bg-[#F8FAFC] dark:bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 mt-4">Loading reset password page...</p>
        </div>
      </div>
    }>
      <ResetPasswordPageContent />
    </Suspense>
  );
}

export default ResetPasswordPageWrapper;
