"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentReviewPage } from "../_hooks/use-current-review-page";
import { ReviewAddPageButton } from "./review-add-page-button";
import { ReviewFilterTabs } from "./review-filter-tabs";
import { ReviewHeader } from "./review-header";
import { ReviewNameField } from "./review-name-field";
import { ReviewPreview } from "./review-preview";
import { ReviewSaveBar } from "./review-save-bar";
import { ReviewToolbar } from "./review-toolbar";

export function ReviewScreen() {
  const router = useRouter();
  const currentPage = useCurrentReviewPage();
  const [name, setName] = useState("");

  const handleSave = () => {
    toast.success("Document saved", {
      description: name || "Untitled document",
    });
    router.push("/");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ReviewHeader />

      <main className="flex-1 px-5 pb-32 pt-4">
        <ReviewPreview page={currentPage} />
        <ReviewToolbar />
        <ReviewFilterTabs page={currentPage} />
        <ReviewNameField name={name} onNameChange={setName} />
        <ReviewAddPageButton />
      </main>

      <ReviewSaveBar onSave={handleSave} />
    </div>
  );
}
