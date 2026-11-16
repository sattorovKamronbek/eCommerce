import { copy } from "@/messages";
export default function Loading() {
  return (
    <div
      className="section page-section"
      role="status"
      aria-label={copy.yuklanmoqda}
    >
      <div className="loading-line" />
      <p>{copy.buyumlarTayyorlanmoqda}</p>
    </div>
  );
}
