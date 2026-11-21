import { useCallback, useId } from "react";
import { X } from "lucide-react";
import type { cs2SellerDictionaries } from "@/messages/cs2-seller";
import { cs2PhotoAccept } from "./cs2-photo-preparation";
import styles from "./cs2-listing-form.module.css";

export type ListingDraftPhoto = { id: string; file?: File };
export type ListingPhotoError = "photoLimit" | "photoFormat" | "photoPrepare";
type PhotoCopy = Pick<typeof cs2SellerDictionaries.en, "photos" | "photoHint" | "cover" | "removePhoto" | "preparingPhotos" | ListingPhotoError>;

function Thumbnail({ photo, src }: { photo: ListingDraftPhoto; src?: string }) {
  const attachPreview = useCallback((image: HTMLImageElement | null) => {
    if (!image || !photo.file) return;
    const url = URL.createObjectURL(photo.file);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [photo.file]);

  // eslint-disable-next-line @next/next/no-img-element -- Editor previews use local blob URLs and authenticated image responses.
  return <img ref={attachPreview} src={src} width={112} height={84} alt="" className={styles.thumbnail} />;
}

export function ListingPhotoPicker({ photos, maxPhotos, photoHref, disabled, preparing, error, copy, onAdd, onRemove }: {
  photos: ListingDraftPhoto[];
  maxPhotos: number;
  photoHref: (fileName: string) => string | undefined;
  disabled: boolean;
  preparing: boolean;
  error?: ListingPhotoError;
  copy: PhotoCopy;
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
          disabled={disabled || photos.length >= maxPhotos}
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
              <Thumbnail photo={photo} src={photo.file ? undefined : photoHref(photo.id)} />
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
