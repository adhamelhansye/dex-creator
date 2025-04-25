import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import LoginModal from "../components/LoginModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import ImageCropModal from "../components/ImageCropModal";
import ThemePreviewModal from "../components/ThemePreviewModal";

// Define types for our modals
type ModalType =
  | "login"
  | "deleteConfirm"
  | "imageCrop"
  | "themePreview"
  | null;

interface ModalContextType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openModal: (type: ModalType, props?: Record<string, any>) => void;
  closeModal: () => void;
  isModalOpen: boolean;
  currentModalType: ModalType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentModalProps: Record<string, any>;
}

const defaultModalContext: ModalContextType = {
  openModal: () => {},
  closeModal: () => {},
  isModalOpen: false,
  currentModalType: null,
  currentModalProps: {},
};

const ModalContext = createContext<ModalContextType>(defaultModalContext);

export const useModal = () => useContext(ModalContext);

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentModalType, setCurrentModalType] = useState<ModalType>(null);
  const [currentModalProps, setCurrentModalProps] = useState<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Record<string, any>
  >({});

  // Function to open a modal with specific props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openModal = (type: ModalType, props: Record<string, any> = {}) => {
    setCurrentModalType(type);
    setCurrentModalProps(props);
    setIsModalOpen(true);
  };

  // Function to close the current modal
  const closeModal = () => {
    setIsModalOpen(false);
    // Reset type and props after a short delay to allow animations to complete
    setTimeout(() => {
      setCurrentModalType(null);
      setCurrentModalProps({});
    }, 300);
  };

  const contextValue = useMemo(
    () => ({
      openModal,
      closeModal,
      isModalOpen,
      currentModalType,
      currentModalProps,
    }),
    [isModalOpen, currentModalType, currentModalProps]
  );

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      <ModalManager />
    </ModalContext.Provider>
  );
}

// The ModalManager component will render the appropriate modal
function ModalManager() {
  const { isModalOpen, currentModalType, currentModalProps, closeModal } =
    useModal();

  // Don't render anything if no modal is open
  if (!isModalOpen || !currentModalType) return null;

  // Render the appropriate modal based on type
  switch (currentModalType) {
    case "login":
      return (
        <LoginModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onLogin={currentModalProps.onLogin}
        />
      );
    case "deleteConfirm":
      return (
        <DeleteConfirmModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onConfirm={currentModalProps.onConfirm}
          entityName={currentModalProps.entityName || "Item"}
        />
      );
    case "imageCrop":
      return (
        <ImageCropModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onApply={currentModalProps.onApply}
          imageSource={currentModalProps.imageSource}
          originalDimensions={currentModalProps.originalDimensions}
          initialCrop={currentModalProps.initialCrop}
          enforceSquare={currentModalProps.enforceSquare}
        />
      );
    case "themePreview":
      return (
        <ThemePreviewModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onApply={modifiedCss => {
            if (currentModalProps.onApply) {
              currentModalProps.onApply(modifiedCss);
            }
            closeModal();
          }}
          onCancel={currentModalProps.onCancel}
          css={currentModalProps.theme}
        />
      );
    default:
      return null;
  }
}
