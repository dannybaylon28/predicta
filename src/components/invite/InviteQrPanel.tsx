import { Copy, Download, QrCode } from "lucide-react";
import { useRef, useState } from "react";
import QRCode from "react-qr-code";
import { useToast } from "../../context/ToastContext";
import { downloadQrPngFromSvg } from "../../utils/downloadQrImage";
import { buildJoinUrl } from "../../utils/inviteLink";

type InviteQrPanelProps = {
  leagueName: string;
  inviteCode: string;
  onCopyLink?: () => void;
};

const QR_SIZE = 168;

export function InviteQrPanel({ leagueName, inviteCode, onCopyLink }: InviteQrPanelProps) {
  const inviteUrl = buildJoinUrl(inviteCode);
  const qrFrameRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const { showToast } = useToast();

  const handleDownload = async () => {
    const svg = qrFrameRef.current?.querySelector("svg");
    if (!svg) {
      showToast("No pudimos encontrar el codigo QR.", "error");
      return;
    }

    setDownloading(true);
    try {
      await downloadQrPngFromSvg(svg, `predicta-${inviteCode.toLowerCase()}`, QR_SIZE);
      showToast("QR descargado.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No pudimos descargar el QR.", "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="invite-qr-panel" aria-label="Invitacion con codigo QR">
      <div className="invite-qr-heading">
        <QrCode size={20} />
        <div>
          <h3>Invitar con QR</h3>
          <p>Escanea o descarga para compartir {leagueName}</p>
        </div>
      </div>

      <div className="invite-qr-frame" ref={qrFrameRef}>
        <QRCode
          value={inviteUrl}
          size={QR_SIZE}
          bgColor="#ffffff"
          fgColor="#0a1c33"
          level="M"
          aria-label={`QR para unirse a ${leagueName}`}
        />
      </div>

      <div className="invite-qr-meta">
        <code>{inviteUrl}</code>
        <div className="invite-qr-actions">
          <button
            className="ghost-button compact"
            type="button"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download size={16} />
            {downloading ? "Descargando..." : "Descargar QR"}
          </button>
          {onCopyLink ? (
            <button className="ghost-button compact" type="button" onClick={onCopyLink}>
              <Copy size={16} />
              Copiar link
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
