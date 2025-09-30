import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import LoginModal from "../components/LoginModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import ConfirmationModal from "../components/ConfirmationModal";
import ImageCropModal from "../components/ImageCropModal";
import ThemePreviewModal from "../components/ThemePreviewModal";
import TradingViewLicenseModal from "../components/TradingViewLicenseModal";
import OrderlyKeyLoginModal from "../components/OrderlyKeyLoginModal";
import AdminLoginModal from "../components/AdminLoginModal";
import GraduationExplanationModal from "../components/GraduationExplanationModal";
import DomainSetupGuideModal from "../components/DomainSetupGuideModal";

type ModalType =
  | "login"
  | "deleteConfirm"
  | "confirmation"
  | "imageCrop"
  | "themePreview"
  | "tradingViewLicense"
  | "orderlyKeyLogin"
  | "adminLogin"
  | "graduationExplanation"
  | "domainSetupGuide"
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
    setIsModalOpen(true);
    setCurrentModalType(type);
    setCurrentModalProps(props);
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
          onClose={currentModalProps.onClose || closeModal}
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
    case "confirmation":
      return (
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onConfirm={currentModalProps.onConfirm}
          title={currentModalProps.title || "Confirm Action"}
          message={
            currentModalProps.message || "Are you sure you want to proceed?"
          }
          warningMessage={currentModalProps.warningMessage}
          confirmButtonText={currentModalProps.confirmButtonText || "Confirm"}
          confirmButtonVariant={
            currentModalProps.confirmButtonVariant || "primary"
          }
          cancelButtonText={currentModalProps.cancelButtonText || "Cancel"}
          isDestructive={currentModalProps.isDestructive || false}
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
          targetDimensions={currentModalProps.targetDimensions}
          enforceSquare={currentModalProps.enforceSquare}
          enforce16by9={currentModalProps.enforce16by9}
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
    case "tradingViewLicense":
      return (
        <TradingViewLicenseModal isOpen={isModalOpen} onClose={closeModal} />
      );
    case "orderlyKeyLogin":
      return (
        <OrderlyKeyLoginModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSuccess={currentModalProps.onSuccess}
          onCancel={currentModalProps.onCancel}
          brokerId={currentModalProps.brokerId}
          accountId={currentModalProps.accountId}
        />
      );
    case "adminLogin":
      return (
        <AdminLoginModal
          isOpen={isModalOpen}
          onClose={closeModal}
          orderlyKey={currentModalProps.orderlyKey}
          accountId={currentModalProps.accountId}
        />
      );
    case "graduationExplanation":
      return (
        <GraduationExplanationModal isOpen={isModalOpen} onClose={closeModal} />
      );
    case "domainSetupGuide":
      return (
        <DomainSetupGuideModal
          isOpen={isModalOpen}
          onClose={closeModal}
          customDomain={currentModalProps.customDomain}
        />
      );
    default:
      return null;
  }
}
