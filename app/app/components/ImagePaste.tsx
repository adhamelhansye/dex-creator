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

  // Handle paste events (from keyboard or programmatically)
  const handlePaste = useCallback(
    async (event?: ClipboardEvent) => {
      if (isProcessing) return;

      setIsProcessing(true);
      try {
        // If called from button, read clipboard via navigator API
        let imageDataUrl: string | null = null;

        if (event) {
          // From keyboard paste event
          event.preventDefault();
          imageDataUrl = await extractImageFromClipboard(event);
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

        // Store the original image in the ref
        originalImageRef.current = imageDataUrl;

        // Get the original dimensions
        try {
          const dimensions = await getImageDimensions(imageDataUrl);
          // Store dimensions in the ref
          originalDimensionsRef.current = dimensions;

          // Set initial crop parameters based on image type
          let initialCrop: CropParams;

          if (imageType === "primaryLogo") {
            // Primary logo: use full image dimensions starting at (0,0)
            initialCrop = {
              x: 0,
              y: 0,
              width: dimensions.width,
              height: dimensions.height,
            };
          } else {
            // Secondary logo and favicon: square aspect ratio (1:1), largest possible from top-left
            const maxSquareSize = Math.min(dimensions.width, dimensions.height);
            initialCrop = {
              x: 0,
              y: 0,
              width: maxSquareSize,
              height: maxSquareSize,
            };
          }

          // Prepare the handleApplyCrop function for this specific paste operation
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

          // Open crop modal instead of entering crop mode inline
          openModal("imageCrop", {
            imageSource: imageDataUrl,
            originalDimensions: dimensions,
            initialCrop,
            enforceSquare,
            onApply: handleApplyCropForThisImage,
          });

          // Reset isProcessing when modal is opened
          setIsProcessing(false);
        } catch (error) {
          console.error("Error getting image dimensions:", error);
          // Fallback to direct processing without crop
          await processAndSaveImage(imageDataUrl);
        }
      } catch (error) {
        console.error("Image paste error:", error);
        setIsProcessing(false);
      }
    },
    [isProcessing, openModal, processAndSaveImage, imageType, enforceSquare]
  );

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

  // Attach event listener when component mounts
  useEffect(() => {
    const pasteArea = pasteAreaRef.current;

    // Define the event handler function (outside the anonymous function)
    const handlePasteEvent = (e: Event) => {
      if (e instanceof ClipboardEvent) {
        handlePaste(e);
      }
    };

    if (pasteArea) {
      // Add the event listener
      pasteArea.addEventListener("paste", handlePasteEvent);

      // Return cleanup function
      return () => {
        pasteArea.removeEventListener("paste", handlePasteEvent);
      };
    }
  }, [handlePaste]); // Add handlePaste to the dependency array

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
        {previewSrc && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-error hover:text-error/80"
          >
            Clear
          </button>
        )}
      </div>

      {/* Main paste area */}
      <div
        ref={pasteAreaRef}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 min-h-[150px] transition-colors focus:outline-none ${
          isProcessing
            ? "bg-background-light/10 border-gray-500"
            : isFocused
              ? "bg-background-light/10 border-primary-light/50"
              : "bg-background-light/5 border-gray-600 hover:border-gray-500"
        }`}
        onClick={() => pasteAreaRef.current?.focus()}
        onFocus={handleFocus}
        onBlur={handleBlur}
        tabIndex={0}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center">
            <div className="i-svg-spinners:pulse-rings-multiple h-8 w-8 text-primary-light mb-2"></div>
            <p className="text-sm text-gray-300">Processing image...</p>
          </div>
        ) : previewSrc ? (
          <div className="flex flex-col items-center">
            <div
              className="relative mb-3 flex items-center justify-center"
              style={{
                width: Math.min(dimensions.width, 200),
                height: Math.min(dimensions.height, 200),
                maxWidth: "100%",
              }}
            >
              <img
                src={previewSrc}
                alt={typeof label === "string" ? label : "Logo"}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <button
              type="button"
              onClick={handlePasteButtonClick}
              className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 rounded-md text-sm text-primary-light transition-colors mt-2"
            >
              Replace Image
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="i-mdi:image-outline h-10 w-10 text-gray-500 mb-2 mx-auto"></div>
            <p className="text-sm text-gray-300 mb-3">
              Add your {typeof label === "string" ? label : "image"}
            </p>

            <button
              type="button"
              onClick={handlePasteButtonClick}
              className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 rounded-md text-sm text-primary-light transition-colors mb-2"
            >
              <span className="flex items-center">
                <span className="i-mdi:content-paste h-4 w-4 mr-1.5"></span>
                Paste Image
              </span>
            </button>

            <p className="text-xs text-gray-500 mt-2">
              Or click here and use Ctrl+V / ⌘+V
            </p>
            {helpText && (
              <p className="mt-2 text-xs text-gray-400">{helpText}</p>
            )}
          </div>
        )}
      </div>

      {/* Size info card */}
      <Card variant="default" className="p-2 text-xs text-gray-400">
        <p>
          <span className="font-medium text-primary-light">
            Recommended size:
          </span>{" "}
          {dimensions.width}x{dimensions.height}px
        </p>
        <p className="mt-1">
          Images will be converted to WebP format and resized automatically.
        </p>
      </Card>
    </div>
  );
}
