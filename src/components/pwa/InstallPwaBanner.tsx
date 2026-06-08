import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { APP_NAME } from "../../constants/brand";

const DISMISS_KEY = "predicta-pwa-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIosDevice(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");
  const [installed, setInstalled] = useState(isStandaloneMode);

  useEffect(() => {
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choice.outcome === "accepted") {
      setInstalled(true);
    }
  };

  if (dismissed || installed) return null;

  if (deferredPrompt) {
    return (
      <div className="install-banner">
        <div className="install-banner-copy">
          <strong>Instala {APP_NAME}</strong>
          <p>Accede mas rapido desde tu telefono como app.</p>
        </div>
        <div className="install-banner-actions">
          <button className="primary-button compact" type="button" onClick={handleInstall}>
            <Download size={16} />
            Instalar
          </button>
          <button className="icon-button" type="button" onClick={dismiss} aria-label="Cerrar aviso">
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (isIosDevice()) {
    return (
      <div className="install-banner install-banner-ios">
        <div className="install-banner-copy">
          <strong>Anadir a inicio</strong>
          <p className="install-ios-steps">
            <Share size={14} />
            <span>En Safari: Compartir → Añadir a pantalla de inicio</span>
          </p>
        </div>
        <button className="icon-button" type="button" onClick={dismiss} aria-label="Cerrar aviso">
          <X size={18} />
        </button>
      </div>
    );
  }

  return null;
}
