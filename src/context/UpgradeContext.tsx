import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { UpgradeModal } from "../components/billing/UpgradeModal";
import type { PlanLimitCode } from "../constants/plan";

type UpgradeContextValue = {
  openUpgrade: (reason: PlanLimitCode) => void;
  closeUpgrade: () => void;
};

const UpgradeContext = createContext<UpgradeContextValue | null>(null);

export function UpgradeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<PlanLimitCode>("CREATE_LEAGUE_LIMIT");

  const openUpgrade = useCallback((nextReason: PlanLimitCode) => {
    setReason(nextReason);
    setOpen(true);
  }, []);

  const closeUpgrade = useCallback(() => setOpen(false), []);

  return (
    <UpgradeContext.Provider value={{ openUpgrade, closeUpgrade }}>
      {children}
      <UpgradeModal open={open} reason={reason} onClose={closeUpgrade} />
    </UpgradeContext.Provider>
  );
}

export function useUpgrade() {
  const context = useContext(UpgradeContext);
  if (!context) {
    throw new Error("useUpgrade debe usarse dentro de UpgradeProvider");
  }
  return context;
}
