import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import type { ClipMediaAsset } from "../shared/types";
import { createAudioAsset, createVideoAsset } from "./videoAsset";

const MEDIA_IMPORT_CONCURRENCY = 2;

async function runWithConcurrency<TInput, TResult>(
  items: TInput[],
  concurrency: number,
  worker: (item: TInput, index: number) => Promise<TResult>
) {
  if (items.length === 0) {
    return [] as PromiseSettledResult<TResult>[];
  }

  const maxConcurrency = Math.max(1, concurrency);
  const results = new Array<PromiseSettledResult<TResult>>(items.length);
  let nextIndex = 0;

  async function runner() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      try {
        const value = await worker(items[currentIndex], currentIndex);
        results[currentIndex] = { status: "fulfilled", value };
      } catch (reason) {
        results[currentIndex] = { status: "rejected", reason };
      }
    }
  }

  const runners = Array.from(
    { length: Math.min(maxConcurrency, items.length) },
    () => runner()
  );
  await Promise.all(runners);
  return results;
}

export function useClipMediaImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlSetRef = useRef(new Set<string>());
  const [assets, setAssets] = useState<ClipMediaAsset[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    const objectUrls = objectUrlSetRef.current;
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.clear();
    };
  }, []);

  const importMediaFiles = useCallback(async (files: File[]) => {
    const mediaFiles = files.filter(
      (file) => file.type.startsWith("video/") || file.type.startsWith("audio/")
    );
    if (mediaFiles.length === 0) {
      return;
    }

    setIsParsing(true);
    try {
      const parsed = await runWithConcurrency(
        mediaFiles,
        MEDIA_IMPORT_CONCURRENCY,
        (file) =>
          file.type.startsWith("audio/")
            ? createAudioAsset(file)
            : createVideoAsset(file)
      );

      setAssets((prev) => {
        const signatureSet = new Set(prev.map((asset) => asset.signature));
        const next = [...prev];

        for (const item of parsed) {
          if (item.status !== "fulfilled") {
            continue;
          }
          if (signatureSet.has(item.value.signature)) {
            URL.revokeObjectURL(item.value.objectUrl);
            continue;
          }
          signatureSet.add(item.value.signature);
          objectUrlSetRef.current.add(item.value.objectUrl);
          next.push(item.value);
        }

        return next;
      });
    } finally {
      setIsParsing(false);
    }
  }, []);

  const onInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      await importMediaFiles(files);
      event.target.value = "";
    },
    [importMediaFiles]
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    assets,
    isParsing,
    importMediaFiles,
    openFilePicker,
    fileInputProps: {
      ref: fileInputRef,
      type: "file" as const,
      accept: "video/*,audio/*",
      multiple: true,
      className: "hidden",
      onChange: onInputChange,
    },
  };
}
