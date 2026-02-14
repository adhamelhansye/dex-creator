import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { useModal } from "../../../../context/ModalContext";
import { useAuth } from "../../../../context/useAuth";

export function HeroSection() {
  const { isConnected } = useAccount();
  const appKit = useAppKit();
  const { openModal, closeModal } = useModal();
  const { isAuthenticated, login } = useAuth();

  const handleGetStarted = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isConnected) {
      appKit?.open({
        namespace: "eip155",
        view: "Connect",
      });
    } else if (!isAuthenticated) {
      openModal("login", {
        onLogin: async () => {
          try {
            await login();
            closeModal();
          } catch (error) {
            console.error("Login failed:", error);
          }
        },
        onClose: () => {
          closeModal();
        },
      });
    }
  };

  return (
    <section className="py-16">
      <div className="flex flex-col justify-center items-center gap-10 max-w-[1088px] mx-auto px-5 lg:px-0">
        <div className="flex flex-col items-center gap-6 text-center max-w-[800px]">
          <h1 className="text-[40px] lg:text-[48px] leading-[1.2] font-semibold bg-base-contrast bg-[linear-gradient(0deg,#9975FF_0%,rgba(189,159,236,0)_53%)] bg-clip-text text-transparent">
            Orderly distributor program
          </h1>
          <p className="text-base-contrast/54 text-lg leading-[1.2]">
            Refer builders to launch their perpetual DEX in ~10 minutes (no code
            required) and earn recurring revenue from trading fees.
          </p>
          <button
            onClick={handleGetStarted}
            className="flex justify-center items-center px-5 py-3 h-10 rounded-full border-0 cursor-pointer text-lg font-medium no-underline transition-opacity hover:opacity-90 bg-[linear-gradient(270deg,#48BDFF_0%,#786CFF_48%,#BD00FF_100%)] text-white"
          >
            Get started
          </button>
        </div>
      </div>
    </section>
  );
}
