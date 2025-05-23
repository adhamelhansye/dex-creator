import { useState, useRef, useEffect, useCallback, ReactNode } from "react";
import {
  convertImage,
  extractImageFromClipboard,
  DEFAULT_DIMENSIONS,
  getImageDimensions,
  CropParams,
} from "../utils/imageUtils";
import { Card } from "./Card";
import { useModal } from "../context/ModalContext";
import { toast } from "react-toastify";
import { Button } from "./Button";

type ImageType = "primaryLogo" | "secondaryLogo" | "favicon";

interface ImagePasteProps {
  id: string;
  label: string | ReactNode;
  value?: string;
  onChange: (value: string | null) => void;
  imageType: ImageType;
  helpText?: string;
}

export default function ImagePaste({
  id,
  label,
  value,
  onChange,
  imageType,
  helpText,
}: ImagePasteProps) {
  const { openModal } = useModal();
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(value || null);
  const [isFocused, setIsFocused] = useState(false);

  // Use refs for data that needs to persist between re-renders and survive component updates
  const originalImageRef = useRef<string | null>(null);
  const originalDimensionsRef = useRef<{
    width: number;
    height: number;
  } | null>(null);
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

  // Get dimensions for the specific image type
  const dimensions = DEFAULT_DIMENSIONS[imageType];

  // Determine if we should enforce square aspect ratio
  const enforceSquare =
    imageType === "secondaryLogo" || imageType === "favicon";

  useEffect(() => {
    // Update preview if value changes externally
    if (value !== undefined && value !== previewSrc) {
      setPreviewSrc(value || null);
    }
  }, [value, previewSrc]);

  // Process and save the image
  const processAndSaveImage = useCallback(
    async (
      imageDataUrl: string,
      cropParams?: CropParams,
      customDimensions?: { width: number; height: number }
    ) => {
      setIsProcessing(true);

      try {
        // Use customDimensions (from crop) if provided, otherwise use default dimensions
        const targetWidth = customDimensions?.width || dimensions.width;
        const targetHeight = customDimensions?.height || dimensions.height;

        // Convert the image to WebP and resize
        const processedImage = await convertImage(
          imageDataUrl,
          targetWidth,
          targetHeight,
          "contain",
          cropParams
        );

        // Set the preview and call onChange
        setPreviewSrc(processedImage);
        onChange(processedImage);
      } catch (error) {
        console.error("Image processing error:", error);
        toast.error("Failed to process image. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [dimensions, onChange]
  );

  // Reusable function to process an image (from paste or file selection)
  const processImageAndOpenCropModal = useCallback(
    async (imageDataUrl: string) => {
      if (!imageDataUrl) {
        console.error("No image data provided");
        toast.error("No image data provided. Please try again.");
        setIsProcessing(false);
        return;
      }

      // Store the original image in the ref
      originalImageRef.current = imageDataUrl;

      // Get the original dimensions
      try {
        const imageDims = await getImageDimensions(imageDataUrl);
        // Store dimensions in the ref
        originalDimensionsRef.current = imageDims;

        // Set initial crop parameters based on image type
        let initialCrop: CropParams;

        if (imageType === "primaryLogo") {
          // Primary logo: use full image dimensions starting at (0,0)
          initialCrop = {
            x: 0,
            y: 0,
            width: imageDims.width,
            height: imageDims.height,
          };
        } else {
          // Secondary logo and favicon: square aspect ratio (1:1), largest possible from top-left
          const maxSquareSize = Math.min(imageDims.width, imageDims.height);
          initialCrop = {
            x: 0,
            y: 0,
            width: maxSquareSize,
            height: maxSquareSize,
          };
        }

        // Prepare the handleApplyCrop function for this specific image operation
        const handleApplyCropForThisImage = async (
          cropParams: CropParams,
          finalDimensions: { width: number; height: number }
        ) => {
          // Access the image and dimensions from refs
          const imageSource = originalImageRef.current;

          if (!imageSource) {
            console.error("Missing original image source");
            return;
          }

          if (cropParams.width <= 0 || cropParams.height <= 0) {
            console.error("Invalid crop dimensions");
            return;
          }

          // Process the image with the crop parameters
          await processAndSaveImage(imageSource, cropParams, finalDimensions);
        };

        // Open crop modal
        openModal("imageCrop", {
          imageSource: imageDataUrl,
          originalDimensions: imageDims,
          initialCrop,
          enforceSquare,
          onApply: handleApplyCropForThisImage,
        });

        setIsProcessing(false);
      } catch (error) {
        console.error(
          "Error getting image dimensions or processing image:",
          error
        );
        toast.error(
          "Could not process image. Please ensure it\\'s a valid image file."
        );
        setIsProcessing(false);
        // Fallback to direct processing without crop if dimensions fail (optional)
        // await processAndSaveImage(imageDataUrl);
      }
    },
    [openModal, processAndSaveImage, imageType, enforceSquare]
  );

  // Handle paste events (from keyboard or programmatically)
  const handlePaste = useCallback(
    async (event?: ClipboardEvent | React.ClipboardEvent<HTMLDivElement>) => {
      if (isProcessing) return;

      setIsProcessing(true);
      try {
        let imageDataUrl: string | null = null;

        if (event) {
          let nativeEventToUse: ClipboardEvent;
          if ("nativeEvent" in event) {
            // It's a React.ClipboardEvent<HTMLDivElement>
            (event as React.ClipboardEvent<HTMLDivElement>).preventDefault();
            nativeEventToUse = (event as React.ClipboardEvent<HTMLDivElement>)
              .nativeEvent;
          } else {
            // It's a native ClipboardEvent
            (event as ClipboardEvent).preventDefault();
            nativeEventToUse = event as ClipboardEvent;
          }
          imageDataUrl = await extractImageFromClipboard(nativeEventToUse);
        } else {
          // From button click - use Clipboard API
          try {
            const clipboardItems = await navigator.clipboard.read();
            for (const clipboardItem of clipboardItems) {
              for (const type of clipboardItem.types) {
                if (type.startsWith("image/")) {
                  const blob = await clipboardItem.getType(type);
                  imageDataUrl = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = e =>
                      resolve((e.target?.result as string) || null);
                    reader.readAsDataURL(blob);
                  });
                  break;
                }
              }
              if (imageDataUrl) break;
            }
          } catch (err) {
            console.error("Clipboard API error:", err);
            toast.error(
              "Could not access clipboard. Please try using Ctrl+V or ⌘+V directly in the paste area."
            );
            // Focus the paste area
            pasteAreaRef.current?.focus();
            setIsProcessing(false);
            return;
          }
        }

        if (!imageDataUrl) {
          console.error("No image found in clipboard");
          toast.error(
            "No image found in clipboard. Please copy an image first."
          );
          setIsProcessing(false);
          return;
        }

        // Process the image using the reusable function
        await processImageAndOpenCropModal(imageDataUrl);
      } catch (error) {
        console.error("Image paste error:", error);
        setIsProcessing(false); // Ensure isProcessing is reset on error
      }
    },
    [isProcessing, processImageAndOpenCropModal] // Removed other dependencies as they are now in processImageAndOpenCropModal
  );

  // Handle file selection
  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (isProcessing) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      if (imageDataUrl) {
        await processImageAndOpenCropModal(imageDataUrl);
      } else {
        toast.error("Could not read the selected image file.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("File selection error:", error);
      toast.error("Failed to load the selected image. Please try again.");
      setIsProcessing(false);
    }

    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Clear the image
  const handleClear = () => {
    setPreviewSrc(null);
    originalImageRef.current = null;
    originalDimensionsRef.current = null;
    onChange(null);
  };

  // Handle focus changes for visual feedback
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  // Request clipboard access and paste
  const handlePasteButtonClick = async () => {
    await handlePaste();
  };

  // Trigger file input click
  const handleSelectFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="block text-sm font-medium text-gray-200">
          {label}
        </label>
        {previewSrc && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-error hover:text-error/70 transition-colors"
            disabled={isProcessing}
          >
            Clear
          </button>
        )}
      </div>

      <div className="mt-1">
        {previewSrc ? (
          <div className="relative group border border-light/15 rounded-lg p-2 flex justify-center items-center bg-base-8/30 min-h-[150px]">
            <img
              src={previewSrc}
              alt={`${imageType} preview`}
              className="max-h-40 max-w-full object-contain rounded"
            />
            <button
              onClick={handleClear}
              className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all focus:opacity-100"
              aria-label="Remove image"
              type="button"
              disabled={isProcessing}
            >
              <div className="i-mdi:close h-3 w-3"></div>
            </button>
          </div>
        ) : (
          <div
            ref={pasteAreaRef}
            tabIndex={0}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors min-h-[150px] flex flex-col justify-center items-center
              ${isFocused ? "border-primary-light bg-primary-light/5" : "border-light/20 hover:border-light/30 bg-base-8/20"}
              ${isProcessing ? "opacity-60 cursor-default pointer-events-none" : ""}`}
            onPaste={
              handlePaste as (
                event: React.ClipboardEvent<HTMLDivElement>
              ) => void
            }
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                pasteAreaRef.current?.focus();
              }
            }}
            role="button"
            aria-label={label ? String(label) : "Paste image area"}
          >
            <div
              className={`mx-auto mb-2 ${isFocused ? "text-primary-light" : "text-gray-400"}`}
            >
              <div className="i-mdi:image-outline h-10 w-10 mx-auto"></div>
            </div>
            <p
              className={`text-sm ${isFocused ? "text-gray-200" : "text-gray-400"} mb-1`}
            >
              {isProcessing ? "Processing..." : "Drag & drop, paste, or"}
            </p>
            {!isProcessing && (
              <button
                type="button"
                onClick={handleSelectFileButtonClick}
                className="text-sm text-primary-light hover:underline focus:outline-none focus:ring-1 focus:ring-primary-light rounded px-1"
              >
                select a file
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-3">
        <Button
          type="button"
          onClick={handlePasteButtonClick}
          variant="secondary"
          size="sm"
          className="w-full sm:w-auto"
          disabled={isProcessing}
          isLoading={isProcessing && originalImageRef.current === null}
          loadingText="Pasting..."
        >
          <span className="flex items-center justify-center gap-1.5">
            <div className="i-mdi:content-paste h-4 w-4"></div>
            Paste Image
          </span>
        </Button>
        <Button
          type="button"
          onClick={handleSelectFileButtonClick}
          variant="secondary"
          size="sm"
          className="w-full sm:w-auto"
          disabled={isProcessing}
          isLoading={isProcessing && originalImageRef.current === null}
          loadingText="Selecting..."
        >
          <span className="flex items-center justify-center gap-1.5">
            <div className="i-mdi:file-image-plus-outline h-4 w-4"></div>
            Select File
          </span>
        </Button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="image/*,image/webp,image/jpeg,image/png,image/gif"
        style={{ display: "none" }}
        disabled={isProcessing}
      />

      {helpText && <p className="mt-2 text-xs text-gray-500">{helpText}</p>}

      <Card variant="default" className="p-3 text-xs text-gray-400 mt-3">
        <p>
          <span className="font-medium text-primary-light">
            Recommended size:
          </span>{" "}
          {dimensions.width}x{dimensions.height}px
        </p>
        <p className="mt-1">
          Images will be converted to WebP format and resized automatically if
          larger.
        </p>
      </Card>
    </div>
  );
}
