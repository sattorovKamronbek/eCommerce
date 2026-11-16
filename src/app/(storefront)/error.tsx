"use client";
import { copy } from "@/messages";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="section page-section empty-state">
      <h1>{copy.sahifaniYuklabBolmadi}</h1>
      <p>{copy.iltimosYanaUrinibKoring}</p>
      <Button onClick={reset}>{copy.qaytaUrinish}</Button>
    </div>
  );
}
