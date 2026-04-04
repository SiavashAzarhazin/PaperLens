"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProcessButtonProps = {
  documentId: string;
  disabled: boolean;
};

export function ProcessButton({ documentId, disabled }: ProcessButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/documents/${documentId}/process`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Could not advance the pipeline.");
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not advance the pipeline."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="process-actions">
      <button
        className="primary-button"
        disabled={disabled || isSubmitting}
        onClick={handleClick}
        type="button"
      >
        {isSubmitting ? "Advancing..." : "Advance pipeline"}
      </button>
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </div>
  );
}
