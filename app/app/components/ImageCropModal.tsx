import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "./Button";
import { CropParams } from "../utils/imageUtils";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (
    cropParams: CropParams,
    finalDimensions: { width: number; height: number }
  ) => Promise<void>;
  imageSource: string;
  originalDimensions: { width: number; height: number };
  initialCrop: CropParams;
  enforceSquare?: boolean;
}

// Define drag handle positions
type HandlePosition =
  | "top-left"
  | "top"
  | "top-right"
  | "left"
  | "center"
  | "right"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

export default function ImageCropModal({
  isOpen,
  onClose,
  onApply,
  imageSource,
  originalDimensions,
  initialCrop,
  enforceSquare = false,
}: ImageCropModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cropDimensions, setCropDimensions] = useState<CropParams>(initialCrop);
  const [finalDimensions, setFinalDimensions] = useState({
    width: initialCrop.width,
    height: initialCrop.height,
  });

  // Mouse interaction states
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<HandlePosition | null>(null);
  const [scale, setScale] = useState(1);

  // Use refs to store values that need to be accessed in event handlers
  const cropDimensionsRef = useRef<CropParams>(cropDimensions);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const dragStartCropRef = useRef<CropParams | null>(null);
  const isDraggingRef = useRef(false);
  const activeHandleRef = useRef<HandlePosition | null>(null);
  const scaleRef = useRef(1);

  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropPreviewRef = useRef<HTMLDivElement>(null);

  // Define handleApply here using useCallback to avoid unnecessary re-creation
  const handleApply = useCallback(async () => {
    if (cropDimensions.width <= 0 || cropDimensions.height <= 0) {
      return; // Invalid crop, don't proceed
    }

    setIsLoading(true);
    try {
      await onApply(cropDimensions, finalDimensions);
      onClose();
    } catch (error) {
      console.error("Error applying crop:", error);
    } finally {
      setIsLoading(false);
    }
  }, [cropDimensions, finalDimensions, onApply, onClose]);

  // Keep refs in sync with state
  useEffect(() => {
    cropDimensionsRef.current = cropDimensions;
  }, [cropDimensions]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    activeHandleRef.current = activeHandle;
  }, [activeHandle]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // Reset when props change
  useEffect(() => {
    setCropDimensions(initialCrop);
    setFinalDimensions({
      width: initialCrop.width,
      height: initialCrop.height,
    });
  }, [initialCrop]);

  // Update crop preview whenever crop dimensions change
  useEffect(() => {
    if (isOpen && imageSource && cropCanvasRef.current && originalDimensions) {
      updateCropPreview();
    }
  }, [isOpen, cropDimensions, imageSource]);

  // Handle keyboard events for the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isLoading) {
        e.preventDefault();
        handleApply();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isLoading, handleApply]);

  // Set up mouse event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (
        !isDraggingRef.current ||
        !cropCanvasRef.current ||
        !dragStartCropRef.current
      )
        return;

      const canvas = cropCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate the delta from the start position
      const deltaX = (mouseX - dragStartPosRef.current.x) / scaleRef.current;
      const deltaY = (mouseY - dragStartPosRef.current.y) / scaleRef.current;

      // Clone the starting crop dimensions for modification
      let newCrop = { ...dragStartCropRef.current };

      // Apply changes based on which handle is active
      switch (activeHandleRef.current) {
        case "center":
          // Move the entire crop area
          newCrop.x = Math.max(
            0,
            Math.min(
              originalDimensions.width - newCrop.width,
              newCrop.x + deltaX
            )
          );
          newCrop.y = Math.max(
            0,
            Math.min(
              originalDimensions.height - newCrop.height,
              newCrop.y + deltaY
            )
          );
          break;

        case "top-left":
          if (enforceSquare) {
            // Keep aspect ratio square - use the larger delta
            const delta = Math.max(deltaX, deltaY);
            newCrop.x = Math.max(
              0,
              Math.min(newCrop.x + newCrop.width - 10, newCrop.x + delta)
            );
            newCrop.y = Math.max(
              0,
              Math.min(newCrop.y + newCrop.height - 10, newCrop.y + delta)
            );
            newCrop.width =
              dragStartCropRef.current.x +
              dragStartCropRef.current.width -
              newCrop.x;
            newCrop.height = newCrop.width;
          } else {
            // Resize from top-left corner
            newCrop.x = Math.max(
              0,
              Math.min(newCrop.x + newCrop.width - 10, newCrop.x + deltaX)
            );
            newCrop.y = Math.max(
              0,
              Math.min(newCrop.y + newCrop.height - 10, newCrop.y + deltaY)
            );
            newCrop.width =
              dragStartCropRef.current.x +
              dragStartCropRef.current.width -
              newCrop.x;
            newCrop.height =
              dragStartCropRef.current.y +
              dragStartCropRef.current.height -
              newCrop.y;
          }
          break;

        // Other cases remain the same, just replace dragStartCrop with dragStartCropRef.current
        case "top-right":
          if (enforceSquare) {
            // Keep aspect ratio square - adjust height to match width
            newCrop.y = Math.max(
              0,
              Math.min(newCrop.y + newCrop.height - 10, newCrop.y + deltaY)
            );
            newCrop.width = Math.max(
              10,
              Math.min(
                originalDimensions.width - newCrop.x,
                dragStartCropRef.current.width - deltaY
              )
            );
            newCrop.height = newCrop.width;
          } else {
            // Resize from top-right corner
            newCrop.y = Math.max(
              0,
              Math.min(newCrop.y + newCrop.height - 10, newCrop.y + deltaY)
            );
            newCrop.width = Math.max(
              10,
              Math.min(
                originalDimensions.width - newCrop.x,
                dragStartCropRef.current.width + deltaX
              )
            );
            newCrop.height =
              dragStartCropRef.current.y +
              dragStartCropRef.current.height -
              newCrop.y;
          }
          break;

        case "bottom-left":
          if (enforceSquare) {
            // Keep aspect ratio square
            newCrop.x = Math.max(
              0,
              Math.min(newCrop.x + newCrop.width - 10, newCrop.x + deltaX)
            );
            newCrop.width =
              dragStartCropRef.current.x +
              dragStartCropRef.current.width -
              newCrop.x;
            newCrop.height = newCrop.width;
          } else {
            // Resize from bottom-left corner
            newCrop.x = Math.max(
              0,
              Math.min(newCrop.x + newCrop.width - 10, newCrop.x + deltaX)
            );
            newCrop.width =
              dragStartCropRef.current.x +
              dragStartCropRef.current.width -
              newCrop.x;
            newCrop.height = Math.max(
              10,
              Math.min(
                originalDimensions.height - newCrop.y,
                dragStartCropRef.current.height + deltaY
              )
            );
          }
          break;

        case "bottom-right":
          if (enforceSquare) {
            // Keep aspect ratio square - use the larger delta
            const delta = Math.max(deltaX, deltaY);
            newCrop.width = Math.max(
              10,
              Math.min(
                originalDimensions.width - newCrop.x,
                dragStartCropRef.current.width + delta
              )
            );
            newCrop.height = newCrop.width;
          } else {
            // Resize from bottom-right corner
            newCrop.width = Math.max(
              10,
              Math.min(
                originalDimensions.width - newCrop.x,
                dragStartCropRef.current.width + deltaX
              )
            );
            newCrop.height = Math.max(
              10,
              Math.min(
                originalDimensions.height - newCrop.y,
                dragStartCropRef.current.height + deltaY
              )
            );
          }
          break;

        case "top":
          // Resize from top edge
          newCrop.y = Math.max(
            0,
            Math.min(newCrop.y + newCrop.height - 10, newCrop.y + deltaY)
          );
          newCrop.height =
            dragStartCropRef.current.y +
            dragStartCropRef.current.height -
            newCrop.y;
          if (enforceSquare) {
            newCrop.width = newCrop.height;
          }
          break;

        case "bottom":
          // Resize from bottom edge
          newCrop.height = Math.max(
            10,
            Math.min(
              originalDimensions.height - newCrop.y,
              dragStartCropRef.current.height + deltaY
            )
          );
          if (enforceSquare) {
            newCrop.width = newCrop.height;
          }
          break;

        case "left":
          // Resize from left edge
          newCrop.x = Math.max(
            0,
            Math.min(newCrop.x + newCrop.width - 10, newCrop.x + deltaX)
          );
          newCrop.width =
            dragStartCropRef.current.x +
            dragStartCropRef.current.width -
            newCrop.x;
          if (enforceSquare) {
            newCrop.height = newCrop.width;
          }
          break;

        case "right":
          // Resize from right edge
          newCrop.width = Math.max(
            10,
            Math.min(
              originalDimensions.width - newCrop.x,
              dragStartCropRef.current.width + deltaX
            )
          );
          if (enforceSquare) {
            newCrop.height = newCrop.width;
          }
          break;
      }

      // Ensure width and height are at least 10 pixels
      newCrop.width = Math.max(10, newCrop.width);
      newCrop.height = Math.max(10, newCrop.height);

      // Update crop dimensions and final dimensions
      setCropDimensions(newCrop);
      setFinalDimensions({
        width: newCrop.width,
        height: newCrop.height,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setActiveHandle(null);
      isDraggingRef.current = false;
      activeHandleRef.current = null;

      // Remove window-level event listeners
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    // Only attach event listeners if we're actually dragging
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      // Clean up when component unmounts or isDragging changes
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }

    return undefined;
  }, [isDragging, enforceSquare, originalDimensions]);

  if (!isOpen) return null;

  const updateCropPreview = () => {
    if (!cropCanvasRef.current || !imageSource) return;

    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Load the original image
    const img = new Image();
    img.onload = () => {
      // Calculate scale factor for the preview
      const maxPreviewSize = 300;
      const calculatedScale = Math.min(
        maxPreviewSize / img.width,
        maxPreviewSize / img.height
      );

      // Store scale for mouse interaction conversions
      setScale(calculatedScale);

      // Set canvas dimensions to match the scaled image
      canvas.width = img.width * calculatedScale;
      canvas.height = img.height * calculatedScale;

      // Draw the image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Calculate scaled crop dimensions
      const scaledX = cropDimensions.x * calculatedScale;
      const scaledY = cropDimensions.y * calculatedScale;
      const scaledWidth = cropDimensions.width * calculatedScale;
      const scaledHeight = cropDimensions.height * calculatedScale;

      // Style for the dark overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";

      // Draw dark overlay in 4 sections around the crop area:
      // Top section
      ctx.fillRect(0, 0, canvas.width, scaledY);
      // Left section
      ctx.fillRect(0, scaledY, scaledX, scaledHeight);
      // Right section
      ctx.fillRect(
        scaledX + scaledWidth,
        scaledY,
        canvas.width - (scaledX + scaledWidth),
        scaledHeight
      );
      // Bottom section
      ctx.fillRect(
        0,
        scaledY + scaledHeight,
        canvas.width,
        canvas.height - (scaledY + scaledHeight)
      );

      // Draw border around crop area
      ctx.strokeStyle = "rgb(89, 91, 255)"; // primary color
      ctx.lineWidth = 2;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Draw resize handles on the corners and edges
      const handleSize = 8;

      // Corner handles (larger for easier targeting)
      drawHandle(
        ctx,
        scaledX - handleSize / 2,
        scaledY - handleSize / 2,
        handleSize,
        handleSize
      ); // top-left
      drawHandle(
        ctx,
        scaledX + scaledWidth - handleSize / 2,
        scaledY - handleSize / 2,
        handleSize,
        handleSize
      ); // top-right
      drawHandle(
        ctx,
        scaledX - handleSize / 2,
        scaledY + scaledHeight - handleSize / 2,
        handleSize,
        handleSize
      ); // bottom-left
      drawHandle(
        ctx,
        scaledX + scaledWidth - handleSize / 2,
        scaledY + scaledHeight - handleSize / 2,
        handleSize,
        handleSize
      ); // bottom-right

      // Edge handles
      drawHandle(
        ctx,
        scaledX + scaledWidth / 2 - handleSize / 2,
        scaledY - handleSize / 2,
        handleSize,
        handleSize
      ); // top
      drawHandle(
        ctx,
        scaledX + scaledWidth / 2 - handleSize / 2,
        scaledY + scaledHeight - handleSize / 2,
        handleSize,
        handleSize
      ); // bottom
      drawHandle(
        ctx,
        scaledX - handleSize / 2,
        scaledY + scaledHeight / 2 - handleSize / 2,
        handleSize,
        handleSize
      ); // left
      drawHandle(
        ctx,
        scaledX + scaledWidth - handleSize / 2,
        scaledY + scaledHeight / 2 - handleSize / 2,
        handleSize,
        handleSize
      ); // right
    };
    img.src = imageSource;
  };

  // Draw a resize handle
  const drawHandle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    ctx.fillStyle = "white";
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = "rgb(89, 91, 255)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
  };

  // Handle crop dimension changes through numeric inputs
  const handleCropChange = (key: keyof CropParams, value: number) => {
    // Ensure dimensions stay within the image bounds
    let newValue = Math.max(0, value);

    // Additional constraints based on dimension type
    if (key === "x") {
      newValue = Math.min(
        newValue,
        originalDimensions.width - cropDimensions.width
      );
    } else if (key === "y") {
      newValue = Math.min(
        newValue,
        originalDimensions.height - cropDimensions.height
      );
    } else if (key === "width") {
      newValue = Math.min(
        newValue,
        originalDimensions.width - cropDimensions.x
      );

      // For square images, update height to match width
      if (enforceSquare) {
        setCropDimensions(prev => ({
          ...prev,
          height: newValue,
          width: newValue,
        }));
        return;
      }
    } else if (key === "height") {
      newValue = Math.min(
        newValue,
        originalDimensions.height - cropDimensions.y
      );

      // For square images, update width to match height
      if (enforceSquare) {
        setCropDimensions(prev => ({
          ...prev,
          width: newValue,
          height: newValue,
        }));
        return;
      }
    }

    // Update the specific dimension
    setCropDimensions(prev => ({
      ...prev,
      [key]: newValue,
    }));

    // Update final dimensions to match crop for output size
    if (key === "width" || key === "height") {
      setFinalDimensions(prev => ({
        ...prev,
        [key]: newValue,
      }));
    }
  };

  // Handle mouse down to start dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropCanvasRef.current) return;

    // Get canvas position and calculate the mouse position within the canvas
    const canvas = cropCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Store starting position
    dragStartPosRef.current = { x: mouseX, y: mouseY };
    dragStartCropRef.current = { ...cropDimensions };

    // Determine if we're clicking on a handle, edge, or the center
    const scaledX = cropDimensions.x * scale;
    const scaledY = cropDimensions.y * scale;
    const scaledWidth = cropDimensions.width * scale;
    const scaledHeight = cropDimensions.height * scale;
    const handleSize = 10; // slightly larger than visible for easier interaction

    // Check corners first (they take precedence)
    if (isNear(mouseX, mouseY, scaledX, scaledY, handleSize)) {
      setActiveHandle("top-left");
      activeHandleRef.current = "top-left";
    } else if (
      isNear(mouseX, mouseY, scaledX + scaledWidth, scaledY, handleSize)
    ) {
      setActiveHandle("top-right");
      activeHandleRef.current = "top-right";
    } else if (
      isNear(mouseX, mouseY, scaledX, scaledY + scaledHeight, handleSize)
    ) {
      setActiveHandle("bottom-left");
      activeHandleRef.current = "bottom-left";
    } else if (
      isNear(
        mouseX,
        mouseY,
        scaledX + scaledWidth,
        scaledY + scaledHeight,
        handleSize
      )
    ) {
      setActiveHandle("bottom-right");
      activeHandleRef.current = "bottom-right";
    }
    // Then check edges
    else if (
      isNear(
        mouseX,
        mouseY,
        scaledX + scaledWidth / 2,
        scaledY,
        handleSize,
        true
      )
    ) {
      setActiveHandle("top");
      activeHandleRef.current = "top";
    } else if (
      isNear(
        mouseX,
        mouseY,
        scaledX + scaledWidth / 2,
        scaledY + scaledHeight,
        handleSize,
        true
      )
    ) {
      setActiveHandle("bottom");
      activeHandleRef.current = "bottom";
    } else if (
      isNear(
        mouseX,
        mouseY,
        scaledX,
        scaledY + scaledHeight / 2,
        handleSize,
        true
      )
    ) {
      setActiveHandle("left");
      activeHandleRef.current = "left";
    } else if (
      isNear(
        mouseX,
        mouseY,
        scaledX + scaledWidth,
        scaledY + scaledHeight / 2,
        handleSize,
        true
      )
    ) {
      setActiveHandle("right");
      activeHandleRef.current = "right";
    }
    // Finally, check if we're in the middle of the crop area
    else if (
      mouseX >= scaledX &&
      mouseX <= scaledX + scaledWidth &&
      mouseY >= scaledY &&
      mouseY <= scaledY + scaledHeight
    ) {
      setActiveHandle("center");
      activeHandleRef.current = "center";
    } else {
      // Clicked outside crop area
      return;
    }

    // Start dragging
    setIsDragging(true);
    isDraggingRef.current = true;
  };

  // Helper to check if mouse is near a point
  const isNear = (
    mouseX: number,
    mouseY: number,
    pointX: number,
    pointY: number,
    threshold: number,
    isEdge = false
  ) => {
    if (isEdge) {
      // For edges, we need to be more lenient in one dimension
      return (
        Math.abs(mouseX - pointX) <= threshold &&
        Math.abs(mouseY - pointY) <= threshold
      );
    }
    return (
      Math.abs(mouseX - pointX) <= threshold &&
      Math.abs(mouseY - pointY) <= threshold
    );
  };

  // Set cursor style based on active handle
  const getCursor = () => {
    if (!activeHandle) return "default";

    switch (activeHandle) {
      case "top-left":
        return "nwse-resize";
      case "top-right":
        return "nesw-resize";
      case "bottom-left":
        return "nesw-resize";
      case "bottom-right":
        return "nwse-resize";
      case "top":
        return "ns-resize";
      case "bottom":
        return "ns-resize";
      case "left":
        return "ew-resize";
      case "right":
        return "ew-resize";
      case "center":
        return "move";
      default:
        return "default";
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center h-screen">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm z-[1001]"
        onClick={isLoading ? undefined : onClose}
      ></div>

      {/* Modal */}
      <div className="relative z-[1002] w-full max-w-4xl p-6 rounded-xl bg-background-light border border-light/10 shadow-2xl slide-fade-in">
        <h3 className="text-xl font-bold mb-4">Crop Image</h3>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Crop preview */}
          <div className="flex-grow flex justify-center">
            <div ref={cropPreviewRef} className="relative">
              <canvas
                ref={cropCanvasRef}
                className="border border-light/20 rounded-md max-w-full"
                width={300}
                height={300}
                onMouseDown={handleMouseDown}
                style={{ cursor: getCursor() }}
              ></canvas>
              <div className="text-xs text-gray-400 text-center mt-2">
                Drag to move, handles to resize
              </div>
            </div>
          </div>

          {/* Crop controls */}
          <div className="flex flex-col gap-3 min-w-[200px]">
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Position</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block">X</label>
                  <input
                    type="number"
                    value={cropDimensions.x}
                    onChange={e =>
                      handleCropChange("x", parseInt(e.target.value))
                    }
                    className="w-full px-2 py-1 bg-dark/50 border border-light/10 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block">Y</label>
                  <input
                    type="number"
                    value={cropDimensions.y}
                    onChange={e =>
                      handleCropChange("y", parseInt(e.target.value))
                    }
                    className="w-full px-2 py-1 bg-dark/50 border border-light/10 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400">Size</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block">Width</label>
                  <input
                    type="number"
                    value={cropDimensions.width}
                    onChange={e =>
                      handleCropChange("width", parseInt(e.target.value))
                    }
                    className="w-full px-2 py-1 bg-dark/50 border border-light/10 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block">Height</label>
                  <input
                    type="number"
                    value={cropDimensions.height}
                    onChange={e =>
                      handleCropChange("height", parseInt(e.target.value))
                    }
                    className="w-full px-2 py-1 bg-dark/50 border border-light/10 rounded-lg text-xs"
                    disabled={enforceSquare}
                  />
                </div>
              </div>
              {enforceSquare && (
                <p className="text-xs text-gray-400">
                  This image type requires a square aspect ratio
                </p>
              )}
            </div>

            <div className="text-xs text-gray-400 mt-3">
              <p>
                Original size: {originalDimensions.width}x
                {originalDimensions.height}px
              </p>
              <p>
                Final size will be: {finalDimensions.width}x
                {finalDimensions.height}
                px
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            isLoading={isLoading}
            loadingText="Applying"
          >
            Apply Crop
          </Button>
        </div>
      </div>
    </div>
  );
}
