import React, { useCallback, useMemo, useState } from 'react';
import { useSwapContext } from 'src/contexts/SwapContext';
import RefreshSVG from 'src/icons/RefreshSVG';
import SettingsSVG from 'src/icons/SettingsSVG';
import { formatNumber } from 'src/misc/utils';

import JupiterLogo from '../icons/JupiterLogo';

import { WalletButton } from './WalletComponents';
import SwapSettingsModal from './SwapSettingsModal/SwapSettingsModal';
import { SolanaFMLogoSVG } from 'src/icons/SolanaFMLogoSVG';
import { useAtom } from 'jotai';
import { appProps } from 'src/library';
import { useAccounts } from 'src/contexts/accounts';
import { WRAPPED_SOL_MINT } from 'src/constants';
import { MINIMUM_SOL_BALANCE } from 'src/misc/constants';
import { useWalletPassThrough } from 'src/contexts/WalletPassthroughProvider';

const Header: React.FC<{ setIsWalletModalOpen(toggle: boolean): void }> = ({ setIsWalletModalOpen }) => {
  const {
    form,
    setForm,
    fromTokenInfo,
    formProps: { swapMode },
    jupiter: { refresh },
  } = useSwapContext();
  const { publicKey } = useWalletPassThrough();
  const { accounts } = useAccounts();
  const [atom] = useAtom(appProps);

  const [showSlippapgeSetting, setShowSlippageSetting] = useState(false);

  const walletPublicKey = useMemo(() => publicKey?.toString(), [publicKey]);

  const jupiterDirectLink = useMemo(() => {
    return `https://jup.ag/swap/${form.fromMint}-${form.toMint}?inAmount=${form.fromValue}`;
  }, [form]);

  const slippageText = useMemo(() => {
    const value = form.slippageBps / 100;
    return isNaN(value) ? '0' : formatNumber.format(value);
  }, [form.slippageBps]);

  const balance = useMemo(() => {
    return fromTokenInfo ? accounts[fromTokenInfo.address]?.balance || 0 : 0;
  }, [accounts, fromTokenInfo]);

  // function to set form from value to max wallet amt
  const onClickMax = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();

      if (!balance || swapMode === 'ExactOut') return;

      if (fromTokenInfo?.address === WRAPPED_SOL_MINT.toBase58()) {
        setForm((prev) => ({
          ...prev,
          fromValue: String(balance > MINIMUM_SOL_BALANCE ? (balance - MINIMUM_SOL_BALANCE).toFixed(6) : 0),
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          fromValue: String(balance),
        }));
      }
    },
    [balance, fromTokenInfo?.address, setForm, swapMode],
  );

  // function to set form from value to half of wallet amt
  const onClickHalf = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();

      if (!balance || swapMode === 'ExactOut') return;

      if (fromTokenInfo?.address === WRAPPED_SOL_MINT.toBase58()) {
        setForm((prev) => ({
          ...prev,
          fromValue: String(balance > MINIMUM_SOL_BALANCE ? ((balance - MINIMUM_SOL_BALANCE) / 2).toFixed(6) : 0),
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          fromValue: String((balance / 2).toFixed(6)),
        }));
      }
    },
    [balance, fromTokenInfo?.address, setForm, swapMode],
  );

  return (
    <div className="mt-2 h-7 pl-3 pr-2">
      <div className={`w-full flex items-center justify-between`}>
        {/* <a href={jupiterDirectLink} target={'_blank'} rel="noreferrer noopener" className="flex items-center space-x-2">
          <JupiterLogo width={24} height={24} />
          <span className="font-bold text-sm dark:text-grey-50 text-grey-700">Jupiter</span>
        </a> */}
        {atom?.showSfmLogo ? (
          <SolanaFMLogoSVG width={24} height={24} className="text-purple-500" />
        ) : (
          <button
            type="button"
            className="p-2 h-7 w-7 flex items-center justify-center border dark:border-navy-600 border-navy-50 dark:bg-dark-800 bg-light-200 group dark:hover:!border-purple-500/80 hover:!border-purple-300/80 rounded-full fill-current"
            onClick={refresh}
          >
            <RefreshSVG />
          </button>
        )}

        <div className="flex space-x-1 items-center">
          {atom?.showSfmLogo &&
            <button
              type="button"
              className="p-2 h-7 w-7 flex items-center justify-center border dark:border-navy-600 border-navy-50 dark:bg-dark-800 bg-light-200 group dark:hover:!border-purple-500/80 hover:!border-purple-300/80 rounded-full fill-current"
              onClick={refresh}
            >
              <RefreshSVG />
            </button>
          }

          {walletPublicKey && (
            <>
              <button
                type="button"
                className="p-5 h-7 space-x-1 flex items-center justify-center border dark:border-navy-600 border-navy-50 dark:bg-dark-800 bg-light-200 group dark:hover:!border-purple-500/80 hover:!border-purple-300/80 rounded-2xl fill-current"
                onClick={onClickHalf}
              >
                <span className="text-xs text-grey-400 group-hover:!text-purple-500">
                  Half
                </span>
              </button>
              <button
                type="button"
                className="p-5 h-7 space-x-1 flex items-center justify-center border dark:border-navy-600 border-navy-50 dark:bg-dark-800 bg-light-200 group dark:hover:!border-purple-500/80 hover:!border-purple-300/80 rounded-2xl fill-current"
                onClick={onClickMax}
              >
                <span className="text-xs text-grey-400 group-hover:!text-purple-500">
                  Max
                </span>
              </button>
            </>
          )}

          <button
            type="button"
            className="p-2 h-7 space-x-1 flex items-center justify-center border dark:border-navy-600 border-navy-50 dark:bg-dark-800 bg-light-200 group dark:hover:!border-purple-500/80 hover:!border-purple-300/80 rounded-2xl fill-current"
            onClick={() => setShowSlippageSetting(true)}
          >
            <SettingsSVG />
            <span suppressHydrationWarning className="text-xs text-grey-400 group-hover:!text-purple-500">
              {slippageText}%
            </span>
          </button>

          {/* remove for sfm ui */}
          {/* <WalletButton setIsWalletModalOpen={setIsWalletModalOpen} /> */}
        </div>
      </div>

      {showSlippapgeSetting ? (
        <div className="absolute z-10 top-0 left-0 w-full h-full overflow-hidden dark:bg-black/50 bg-black/30 flex items-center px-4">
          <SwapSettingsModal closeModal={() => setShowSlippageSetting(false)} />
        </div>
      ) : null}
    </div>
  );
};

export default Header;
