import React, { FC, MouseEvent, useCallback } from 'react';
import { useWalletPassThrough } from 'src/contexts/WalletPassthroughProvider';

export const WalletModalButton: FC<{ setIsWalletModalOpen(toggle: boolean): void }> = ({ setIsWalletModalOpen }) => {
  const { connecting } = useWalletPassThrough();

  const handleClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    if (window.Jupiter.enableWalletPassthrough && window.Jupiter.onRequestConnectWallet) {
      window.Jupiter.onRequestConnectWallet();
    } else { 
      setIsWalletModalOpen(true);
    }
  }, [setIsWalletModalOpen]);

  return (
    <button
      type="button"
      className="py-2 px-3 h-7 flex items-center rounded-2xl text-xs dark:bg-dark-700/70 bg-light-400 dark:text-grey-50 text-grey-700 border border-transparent dark:hover:border-navy-500 hover:border-grey-100"
      onClick={handleClick}
    >
      {connecting ? (
        <span>
          <span>Connecting...</span>
        </span>
      ) : (
        <span>
          <span>Connect Wallet</span>
        </span>
      )}
    </button>
  );
};
