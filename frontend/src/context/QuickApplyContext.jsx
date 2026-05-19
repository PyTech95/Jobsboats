import { createContext, useContext, useState, useCallback } from "react";
import QuickApplyDialog from "@/components/QuickApplyDialog";

const QuickApplyContext = createContext(null);

export function QuickApplyProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [meta, setMeta] = useState({ jobId: null, jobTitle: null });

  const openApply = useCallback((opts = {}) => {
    setMeta({ jobId: opts.jobId || null, jobTitle: opts.jobTitle || null });
    setOpen(true);
  }, []);

  return (
    <QuickApplyContext.Provider value={{ openApply }}>
      {children}
      <QuickApplyDialog
        open={open}
        onOpenChange={setOpen}
        jobId={meta.jobId}
        jobTitle={meta.jobTitle}
      />
    </QuickApplyContext.Provider>
  );
}

export const useQuickApply = () => useContext(QuickApplyContext);
