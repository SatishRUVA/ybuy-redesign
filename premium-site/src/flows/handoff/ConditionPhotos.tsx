import { useEffect, useRef, useState } from 'react';
import { Camera, Plus, X } from 'lucide-react';

/** Keeps uploaded condition evidence compact enough for the demo's browser-only persistence. */
function preparePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) { reject(new Error('Choose an image smaller than 20 MB.')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('This photo could not be read.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Use a JPG, PNG, or WebP photo.'));
      image.onload = () => {
        const scale = Math.min(1, 800 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        if (!context) { reject(new Error('Photo processing is unavailable.')); return; }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/** Camera-first condition evidence with accessible remove controls and upload feedback. */
export function ConditionPhotos({ photos, onChange }: { photos: string[]; onChange: (photos: string[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  return <section className="handoff-photos" aria-label="Condition photos">
    <div className="handoff-section-line"><h3>Condition photos</h3><span>{photos.length}/6 added · 2 minimum</span></div>
    <p>One full view and one close-up is a good start. Clear photos protect both sides.</p>
    <div className="handoff-photo-grid">{photos.map((photo, index) => <div className="handoff-photo" key={`${index}-${photo.slice(-24)}`}><a href={photo} download={`ybuy-condition-${index + 1}.jpg`} aria-label={`Save condition photo ${index + 1}`}><img src={photo} alt={`Condition photo ${index + 1}`} /></a><button type="button" className="icon-button" disabled={busy} aria-label={`Remove condition photo ${index + 1}`} onClick={() => onChange(photos.filter((_, n) => n !== index))}><X size={18} /></button></div>)}
      {photos.length < 6 && <label className={`handoff-add-photo ${busy ? 'handoff-add-photo--busy' : ''}`}><Camera size={26} aria-hidden="true" /><span>{busy ? 'Preparing…' : 'Add photos'}</span><Plus size={16} aria-hidden="true" /><input type="file" accept="image/*" capture="environment" multiple disabled={busy} aria-label="Take or add condition photos" onChange={async (event) => {
        const files = Array.from(event.target.files ?? []); event.target.value = ''; if (!files.length) return;
        setBusy(true); setError('');
        try {
          const additions = await Promise.all(files.slice(0, 6 - photos.length).map(preparePhoto));
          if (mounted.current) onChange([...photos, ...additions]);
        } catch (reason) { if (mounted.current) setError(reason instanceof Error ? reason.message : 'Try another photo.'); } finally { if (mounted.current) setBusy(false); }
      }} /></label>}
    </div>
    <p role="status" className="form-disclaimer">{busy ? 'Preparing your photos. Please wait before continuing.' : photos.length >= 2 ? 'Your condition photos are ready.' : `Add ${2 - photos.length} more ${photos.length === 1 ? 'photo' : 'photos'} to continue.`}</p>
    {error && <p role="alert" className="field-error">{error}</p>}
  </section>;
}
