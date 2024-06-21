import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { NumberFormatValues, NumericFormat } from 'react-number-format';

import { useAccounts } from '../contexts/accounts';

import { MAX_INPUT_LIMIT, MINIMUM_SOL_BALANCE } from '../misc/constants';

import CoinBalance from './Coinbalance';
import FormError from './FormError';
import JupButton from './JupButton';

import TokenIcon from './TokenIcon';

import { SwapMode } from '@jup-ag/react-hook';
import { UnifiedWalletButton } from '@jup-ag/wallet-adapter';
import classNames from 'classnames';
import { useSwapContext } from 'src/contexts/SwapContext';
import { useWalletPassThrough } from 'src/contexts/WalletPassthroughProvider';
import ChevronDownIcon from 'src/icons/ChevronDownIcon';
import { RoutesSVG } from 'src/icons/RoutesSVG';
import WalletIcon from 'src/icons/WalletIcon';
import { detectedSeparator } from 'src/misc/utils';
import { WRAPPED_SOL_MINT } from '../constants';
import { CoinBalanceUSD } from './CoinBalanceUSD';
import PriceInfo from './PriceInfo/index';
import V2SexyChameleonText from './SexyChameleonText/V2SexyChameleonText';
import SwitchPairButton from './SwitchPairButton';
import useTimeDiff from './useTimeDiff/useTimeDiff';
import { Skeleton } from './Skeleton';
import PriceInfoV2 from './PriceInfoV2';
import JupiterLogo from 'src/icons/JupiterLogo';

const Form: React.FC<{
  onSubmit: () => void;
  isDisabled: boolean;
  setSelectPairSelector: React.Dispatch<React.SetStateAction<'fromMint' | 'toMint' | null>>;
  setIsWalletModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ onSubmit, isDisabled, setSelectPairSelector, setIsWalletModalOpen }) => {
  const { publicKey } = useWalletPassThrough();
  const { accounts } = useAccounts();
  const {
    form,
    setForm,
    errors,
    fromTokenInfo,
    toTokenInfo,
    quoteResponseMeta,
    formProps: { swapMode, fixedAmount, fixedInputMint, fixedOutputMint },
    jupiter: { quoteResponseMeta: route, loading, error, refresh },
  } = useSwapContext();
  const [hasExpired, timeDiff] = useTimeDiff();
  const [inputFromFocus, setInputFromFocus] = useState<boolean>(false);
  const [inputToFocus, setInputToFocus] = useState<boolean>(false);
  useEffect(() => {
    if (hasExpired) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasExpired]);

  const walletPublicKey = useMemo(() => publicKey?.toString(), [publicKey]);

  const onChangeFromValue = (value: string) => {
    if (value === '') {
      setForm((form) => ({ ...form, fromValue: '', toValue: '' }));
      return;
    }

    const isInvalid = Number.isNaN(value);
    if (isInvalid) return;

    setForm((form) => ({ ...form, fromValue: value }));
  };

  const onChangeToValue = (value: string) => {
    if (value === '') {
      setForm((form) => ({ ...form, fromValue: '', toValue: '' }));
      return;
    }

    const isInvalid = Number.isNaN(value);
    if (isInvalid) return;

    setForm((form) => ({ ...form, toValue: value }));
  };

  const balance = useMemo(() => {
    return fromTokenInfo ? accounts[fromTokenInfo.address]?.balance || 0 : 0;
  }, [accounts, fromTokenInfo]);

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

  const onClickSwitchPair = () => {
    setForm((prev) => ({
      ...prev,
      fromValue: '',
      toValue: '',
      fromMint: prev.toMint,
      toMint: prev.fromMint,
    }));
  };

  const hasFixedMint = useMemo(() => fixedInputMint || fixedOutputMint, [fixedInputMint, fixedOutputMint]);
  const { inputAmountDisabled } = useMemo(() => {
    const result = { inputAmountDisabled: true, outputAmountDisabled: true };
    if (!fixedAmount) {
      if (swapMode === SwapMode.ExactOut) {
        result.outputAmountDisabled = false;
      } else {
        result.inputAmountDisabled = false;
      }
    }
    return result;
  }, [fixedAmount, swapMode]);

  const marketRoutes = quoteResponseMeta
    ? quoteResponseMeta.quoteResponse.routePlan.map(({ swapInfo }) => swapInfo.label).join(', ')
    : '';

  const onClickSelectFromMint = useCallback(() => {
    if (fixedInputMint) return;
    setSelectPairSelector('fromMint');
  }, [fixedInputMint, setSelectPairSelector]);

  const onClickSelectToMint = useCallback(() => {
    if (fixedOutputMint) return;
    setSelectPairSelector('toMint');
  }, [fixedOutputMint, setSelectPairSelector]);

  const fixedOutputFomMintClass = useMemo(() => {
    if (swapMode === 'ExactOut' && !form.toValue) return 'opacity-20 hover:opacity-100';
    return '';
  }, [form.toValue, swapMode]);

  const thousandSeparator = useMemo(() => (detectedSeparator === ',' ? '.' : ','), []);
  // Allow empty input, and input lower than max limit
  const withValueLimit = useCallback(
    ({ floatValue }: NumberFormatValues) => !floatValue || floatValue <= MAX_INPUT_LIMIT,
    [],
  );

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (window.Jupiter.enableWalletPassthrough && window.Jupiter.onRequestConnectWallet) {
        window.Jupiter.onRequestConnectWallet();
      } else {
        setIsWalletModalOpen(true);
      }
    },
    [setIsWalletModalOpen],
  );

  return (
    <div className="h-full flex flex-col items-center justify-center pb-4">
      <div className="w-full mt-2 rounded-xl flex flex-col px-2">
        <div className="flex-col">
          <div
            className={classNames(
              `border-b border-transparent dark:bg-dark-700 dark:bg-opacity-70 bg-light-400 rounded-xl border transition-shadow ${inputFromFocus ? 'dark:!border-purple-500 !border-purple-300/80 shadow-[0px_0px_10px_2px] shadow-purple-500/50' : ''}`,
              fixedOutputFomMintClass,
            )}
          >
            <div className={classNames('px-x border-transparent rounded-xl ')}>
              <div>
                <div className={classNames('py-5 px-4 flex flex-col dark:text-white')}>
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      className={`py-2 px-5 rounded-xl flex items-center group dark:bg-dark-500 bg-light-500 border border-transparent dark:text-grey-50 text-grey-700 gap-3 ${!fixedInputMint ? 'dark:hover:bg-purple-500/30 hover:bg-purple-100/40 dark:hover:!border-purple-500/80 hover:!border-purple-300/80 hover:shadow-[0px_0px_10px_2px] hover:shadow-purple-500/50 disabled:dark:hover:bg-dark-500 disabled:hover:bg-light-500 transition-shadow duration-200' : ''}`}
                      disabled={fixedInputMint}
                      onClick={onClickSelectFromMint}
                    >
                      <div className="h-5 w-5">
                        <TokenIcon tokenInfo={fromTokenInfo} width={20} height={20} />
                      </div>
                      <div className="font-semibold" translate="no">
                        {fromTokenInfo?.symbol}
                      </div>
                      {fixedInputMint ? null : (
                        <span className="dark:text-grey-50 text-grey-700 dark:group-hover:!text-purple-400 group-hover:!text-purple-300 fill-current">
                          <ChevronDownIcon />
                        </span>
                      )}
                    </button>

                    <div className="text-right">
                      <NumericFormat
                        disabled={fixedAmount || swapMode === 'ExactOut'}
                        value={typeof form.fromValue === 'undefined' ? '' : form.fromValue}
                        decimalScale={fromTokenInfo?.decimals}
                        thousandSeparator={thousandSeparator}
                        allowNegative={false}
                        valueIsNumericString
                        onValueChange={({ value }) => onChangeFromValue(value)}
                        onFocus={() => setInputFromFocus(true)}
                        onBlur={() => setInputFromFocus(false)}
                        placeholder={'0.00'}
                        className={classNames(
                          'h-full w-full bg-transparent dark:text-grey-50 text-grey-700 text-right font-semibold text-lg focus:outline-none',
                          { 'cursor-not-allowed': inputAmountDisabled },
                        )}
                        decimalSeparator={detectedSeparator}
                        isAllowed={withValueLimit}
                      />
                    </div>
                  </div>

                  {fromTokenInfo?.address ? (
                    <div className="flex justify-between items-center">
                      <div
                        className={classNames(
                          'flex mt-3 space-x-1 text-xs items-center dark:text-grey-50 text-grey-700 fill-current',
                          {
                            'cursor-pointer': swapMode !== 'ExactOut',
                          },
                        )}
                        onClick={onClickMax}
                      >
                        <WalletIcon width={10} height={10} />
                        <CoinBalance mintAddress={fromTokenInfo.address} />
                        <span>{fromTokenInfo.symbol}</span>
                      </div>

                      {form.fromValue ? (
                        <span className="text-xs dark:text-grey-50 text-grey-700">
                          <CoinBalanceUSD tokenInfo={fromTokenInfo} amount={form.fromValue} />
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className={'my-2'}>
            {hasFixedMint ? null : (
              <SwitchPairButton onClick={onClickSwitchPair} className={classNames(fixedOutputFomMintClass)} />
            )}
          </div>

          <div
            className={`border-b border-transparent dark:bg-dark-700 bg-opacity-70 bg-light-400 rounded-xl border ${inputToFocus ? '!border-purple-500 !border-purple-300/80 shadow-[0px_0px_10px_2px] shadow-purple-500/50' : ''}`}
          >
            <div className="px-x border-transparent rounded-xl">
              <div>
                <div className="py-5 px-4 flex flex-col dark:text-white">
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      className={`py-2 px-5 rounded-xl flex items-center group dark:bg-dark-500 bg-light-500 border border-transparent dark:text-grey-50 text-grey-700 gap-3 ${!fixedOutputMint ? 'dark:hover:bg-purple-500/30 hover:bg-purple-100/40 dark:hover:!border-purple-500/80 hover:!border-purple-300/80 hover:shadow-[0px_0px_10px_2px] hover:shadow-purple-500/50 disabled:dark:hover:bg-dark-500 disabled:hover:bg-light-500 transition-shadow duration-200' : ''}`}
                      disabled={fixedOutputMint}
                      onClick={onClickSelectToMint}
                    >
                      <div className="h-5 w-5">
                        <TokenIcon tokenInfo={toTokenInfo} width={20} height={20} />
                      </div>
                      <div className="font-semibold" translate="no">
                        {toTokenInfo?.symbol}
                      </div>

                      {fixedOutputMint ? null : (
                        <span className="dark:text-grey-50 text-grey-700 dark:group-hover:!text-purple-400 group-hover:!text-purple-300 fill-current">
                          <ChevronDownIcon />
                        </span>
                      )}
                    </button>

                    <div className="text-right">
                      {loading && form.fromValue ? (
                        <Skeleton className="w-[120px] h-5" />
                      ) : (
                        <NumericFormat
                          disabled={!swapMode || swapMode === 'ExactIn'}
                          // value={typeof form.toValue === 'undefined' ? '' : form.toValue}
                          value={
                            typeof form.toValue === 'undefined' || (!form.fromValue && Number(form.fromValue) === 0)
                              ? ''
                              : form.toValue
                          }
                          decimalScale={toTokenInfo?.decimals}
                          thousandSeparator={thousandSeparator}
                          allowNegative={false}
                          valueIsNumericString
                          onValueChange={({ value }) => onChangeToValue(value)}
                          onFocus={() => setInputToFocus(true)}
                          onBlur={() => setInputToFocus(false)}
                          placeholder={swapMode === 'ExactOut' ? 'Enter desired amount' : ''}
                          className={classNames(
                            'h-full w-full bg-transparent dark:text-grey-50 text-grey-700 text-right font-semibold placeholder:text-sm placeholder:font-normal text-lg focus:outline-none',
                          )}
                          decimalSeparator={detectedSeparator}
                          isAllowed={withValueLimit}
                        />
                      )}
                    </div>
                  </div>

                  {toTokenInfo?.address ? (
                    <div className="flex justify-between items-center">
                      <div className="flex mt-3 space-x-1 text-xs items-center dark:text-grey-50 text-grey-700 fill-current">
                        <WalletIcon width={10} height={10} />
                        <CoinBalance mintAddress={toTokenInfo.address} />
                        <span>{toTokenInfo.symbol}</span>
                      </div>
                      {loading && form.fromValue ? (
                        <Skeleton className="w-[60px] h-4" />
                      ) : form.fromValue && form.toValue ? (
                        <span className="text-xs dark:text-grey-50 text-grey-700 ">
                          <CoinBalanceUSD tokenInfo={toTokenInfo} amount={form.toValue} />
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {loading && form.fromValue ? (
            <Skeleton className="w-[250px] h-4 mt-2" />
          ) : route?.quoteResponse && form.fromValue ? (
            <div className="flex items-center mt-2 text-xs space-x-1">
              <div className="dark:bg-dark-500 bg-light-500 rounded-xl px-2 py-1 dark:text-white/50 text-white flex items-center space-x-1">
                <RoutesSVG width={7} height={9} />
              </div>
              <span className="text-grey-400">using</span>
              <span className="dark:text-grey-50 text-grey-700 overflow-hidden whitespace-nowrap text-ellipsis max-w-[70%]">
                {marketRoutes}
              </span>
            </div>
          ) : (
            // add fake height to prevent button from moving up and down
            <div className='h-4 mt-2'></div>
          )}
        </div>

        {walletPublicKey ? <FormError errors={errors} /> : null}
      </div>

      <div className="w-full flex flex-col gap-2 px-2">
        {!walletPublicKey ? (
          <UnifiedWalletButton
            buttonClassName="!bg-transparent"
            overrideContent={
              <JupButton size="lg" className="w-full mt-4" type="button" onClick={handleClick}>
                Connect Wallet
              </JupButton>
            }
          />
        ) : (
          <JupButton
            size="lg"
            className={`w-full mt-4 disabled:opacity-50 text-purple-50 ${loading || error ? 'dark:bg-purple-500 bg-purple-300' : 'bg-gradient-to-r from-[#8057FF] to-[#D84E76]'}`}
            type="button"
            onClick={onSubmit}
            disabled={isDisabled || loading}
          >
            {loading ? (
              <span className="text-sm">Loading...</span>
            ) : error ? (
              <span className="text-sm ">Error fetching route. Try changing your input</span>
            ) : (
              <span className="">{fixedOutputMint ? 'Buy fmSOL' : fixedInputMint ? 'Withdraw fmSOL' : 'Swap'}</span>
            )}
          </JupButton>
        )}

        <div className="w-full flex flex-row gap-4 items-center justify-center mt-4">
          <span className="text-xs dark:text-grey-50 text-grey-700 font-extralight">Powered by</span>
          <JupiterLogo width={20} height={20} />
          <span className="font-semibold text-xs dark:text-grey-50 text-grey-700">Jupiter</span>
        </div>

        <hr className="w-full dark:border-navy-600 border-navy-50 h-px mt-4" />

        {/* refactored SFM version */}
        {/* will do checking directly inside */}
        {fromTokenInfo && toTokenInfo ? (
          <PriceInfoV2
            quoteResponse={quoteResponseMeta?.quoteResponse}
            fromTokenInfo={fromTokenInfo}
            toTokenInfo={toTokenInfo}
            loading={loading}
          />
        ) : null}
      </div>
    </div>
  );
};

export default Form;
