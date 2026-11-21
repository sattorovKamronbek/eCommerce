import { useCallback, useId } from "react";
import { X } from "lucide-react";
import { CS2_MAX_PHOTOS, cs2PhotoHref } from "@/lib/sellers/cs2";
import type { cs2SellerDictionaries } from "@/messages/cs2-seller";
import { cs2PhotoAccept } from "./cs2-photo-preparation";
import styles from "./cs2-listing-form.module.css";

export type Cs2DraftPhoto = { id: string; file?: File };
export type Cs2PhotoError = "photoLimit" | "photoFormat" | "photoPrepare";

function Thumbnail({ photo, listingId }: { photo: Cs2DraftPhoto; listingId?: string }) {
  const attachPreview = useCallback((image: HTMLImageElement | null) => {
    if (!image || !photo.file) return;
    const url = URL.createObjectURL(photo.file);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [photo.file]);

  const src = listingId && !photo.file ? cs2PhotoHref(listingId, photo.id, true) : undefined;
  // eslint-disable-next-line @next/next/no-img-element -- Editor previews use local blob URLs and authenticated image responses.
  return <img ref={attachPreview} src={src} width={112} height={84} alt="" className={styles.thumbnail} />;
}

export function Cs2PhotoPicker({ photos, listingId, disabled, preparing, error, copy, onAdd, onRemove }: {
  photos: Cs2DraftPhoto[];
  listingId?: string;
  disabled: boolean;
  preparing: boolean;
  error?: Cs2PhotoError;
  copy: typeof cs2SellerDictionaries.en;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
}) {
  const hintId = useId();
  return (
    <div className={styles.photoPicker}>
      <label>{copy.photos}
        <input
          type="file"
          accept={cs2PhotoAccept}
          multiple
          aria-describedby={hintId}
          disabled={disabled || photos.length >= CS2_MAX_PHOTOS}
          className={styles.fileInput}
          onChange={event => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = "";
            if (files.length) onAdd(files);
          }}
        />
      </label>
      <p id={hintId} className={styles.hint}>{copy.photoHint}</p>
      {preparing && <p role="status" className={styles.hint}>{copy.preparingPhotos}</p>}
      {error && <p role="alert" className={styles.hint}>{copy[error]}</p>}
      {photos.length > 0 && (
        <ol className={styles.photos}>
          {photos.map((photo, index) => (
            <li key={photo.id} className={styles.photo}>
              <Thumbnail photo={photo} listingId={listingId} />
              {index === 0 && <span className={styles.cover}>{copy.cover}</span>}
              <button
                type="button"
                className={styles.removePhoto}
                aria-label={`${copy.removePhoto} ${index + 1}`}
                disabled={disabled}
                onClick={() => onRemove(photo.id)}
              ><X aria-hidden="true" size={16} /></button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
