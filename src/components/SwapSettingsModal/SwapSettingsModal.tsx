import classNames from 'classnames';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';

import CloseIcon from 'src/icons/CloseIcon';
import InfoIconSVG from 'src/icons/InfoIconSVG';
import InformationMessage from '../InformationMessage';
import Tooltip from '../Tooltip';
import SwapSettingButton from './SwapSettingButton';

import { DEFAULT_SLIPPAGE } from 'src/constants';
import { PriorityLevel, PriorityMode, usePrioritizationFee } from 'src/contexts/PrioritizationFeeContextProvider';
import { useSwapContext } from 'src/contexts/SwapContext';
import { PreferredTokenListMode, useTokenContext } from 'src/contexts/TokenContextProvider';
import { useWalletPassThrough } from 'src/contexts/WalletPassthroughProvider';
import ExternalIcon from 'src/icons/ExternalIcon';
import { SOL_TOKEN_INFO } from 'src/misc/constants';
import { detectedSeparator, formatNumber, toLamports } from 'src/misc/utils';
import { useReferenceFeesQuery } from 'src/queries/useReferenceFeesQuery';
import { CoinBalanceUSD } from '../CoinBalanceUSD';
import JupButton from '../JupButton';
import Toggle from '../Toggle';

const PRIORITY_LEVEL_MAP: Record<PriorityLevel, string> = {
  MEDIUM: 'Fast',
  HIGH: 'Turbo',
  VERY_HIGH: 'Ultra',
};

const PRIORITY_MODE_MAP: Record<PriorityMode, string> = {
  MAX: 'Max Cap',
  EXACT: 'Exact Fee',
};

const Separator = () => <div className="my-4 border-b border-white/10" />;

type Form = {
  // Priority Fee
  unsavedPriorityFee: number;
  unsavedPriorityMode: PriorityMode;
  unsavedPriorityLevel: PriorityLevel;
  hasUnsavedFeeChanges: boolean;

  slippagePreset?: string;
  slippageInput?: string;

  onlyDirectRoutes: boolean;
  useWSol: boolean;
  asLegacyTransaction: boolean;
  preferredTokenListMode: PreferredTokenListMode;
};

// constants
const MINIMUM_PRIORITY_FEE = 0;
const MINIMUM_SLIPPAGE = 0;
const MAXIMUM_SLIPPAGE = 50; // 50%
const MINIMUM_SUGGESTED_SLIPPAGE = 0.05; // 0.05%
const MAXIMUM_SUGGESTED_SLIPPAGE = 10; // 10%

const SLIPPAGE_PRESET = ['0.3', String(DEFAULT_SLIPPAGE), '1.0'];

const SwapSettingsModal: React.FC<{ closeModal: () => void }> = ({ closeModal }) => {
  const {
    form: { slippageBps },
    setForm,
    jupiter: { asLegacyTransaction, setAsLegacyTransaction },
    setUserSlippage,
  } = useSwapContext();
  const { data: referenceFees } = useReferenceFeesQuery();
  const { preferredTokenListMode, setPreferredTokenListMode } = useTokenContext();
  const { priorityFee, priorityMode, priorityLevel, setPriorityFee, setPriorityMode, setPriorityLevel } =
    usePrioritizationFee();
  const { wallet } = useWalletPassThrough();

  const slippageInitialPreset = useMemo(() => {
    const value = slippageBps / 100;
    return SLIPPAGE_PRESET.find((preset) => Number(preset) === value);
  }, [slippageBps]);

  const form = useForm<Form>({
    defaultValues: {
      ...(slippageBps
        ? slippageInitialPreset
          ? {
              slippagePreset: String(slippageInitialPreset),
            }
          : {
              slippageInput: String(slippageBps / 100),
            }
        : {}),
      asLegacyTransaction,
      preferredTokenListMode,
      // Priority Fee
      unsavedPriorityFee: priorityFee,
      unsavedPriorityMode: priorityMode,
      unsavedPriorityLevel: priorityLevel,
      hasUnsavedFeeChanges: false,
    },
  });

  /* SLIPPAGE */
  // ref
  const inputRef = useRef<HTMLInputElement>();
  const inputFocused = useRef(!slippageInitialPreset);

  // form value
  const slippageInput = form.watch('slippageInput');
  const slippagePreset = form.watch('slippagePreset');

  // variable
  const isWithinSlippageLimits = useMemo(() => {
    return Number(slippageInput) >= MINIMUM_SLIPPAGE && Number(slippageInput) <= MAXIMUM_SLIPPAGE;
  }, [slippageInput]);
  const slippageSuggestionText = useMemo(() => {
    if (inputFocused.current === false) return '';
    if (Number(slippageInput) <= MINIMUM_SUGGESTED_SLIPPAGE) {
      return <span>Your transaction may fail</span>;
    }

    if (Number(slippageInput) >= MAXIMUM_SUGGESTED_SLIPPAGE) {
      return <span>Warning, slippage is high</span>;
    }

    return '';
  }, [slippageInput]);
  /* END OF SLIPPAGE */

  /* PRIORITY FEE */
  // state
  const [isPriorityFeeInputFocused, setIsPriorityFeeInputFocused] = useState(false);

  // form value
  const unsavedPriorityFee = form.watch('unsavedPriorityFee');
  const unsavedPriorityMode = form.watch('unsavedPriorityMode');
  const unsavedPriorityLevel = form.watch('unsavedPriorityLevel');
  const hasUnsavedFeeChanges = form.watch('hasUnsavedFeeChanges');

  // variable
  const isMaxPriorityMode = useMemo(() => unsavedPriorityMode === 'MAX', [unsavedPriorityMode]);
  const unsavedPriorityFeeLamports = useMemo(() => toLamports(unsavedPriorityFee, 9), [unsavedPriorityFee]);
  const isPrioritizationFeeLowerThanReferenceFee = useMemo(() => {
    const referenceFeeInMediumPriorityLevel = referenceFees?.jup.m ?? 0;
    return referenceFeeInMediumPriorityLevel > unsavedPriorityFeeLamports;
  }, [referenceFees?.jup.m, unsavedPriorityFeeLamports]);
  /* END OF PRIORITY FEE */

  /* OTHERS */
  const asLegacyTransactionInput = form.watch('asLegacyTransaction');
  const preferredTokenListModeInput = form.watch('preferredTokenListMode');
  const detectedVerTxSupport = useMemo(() => {
    return wallet?.adapter?.supportedTransactionVersions?.has(0);
  }, [wallet]);
  /* END OF OTHERS */

  const isButtonDisabled = useMemo(() => {
    // Slippage
    if (inputFocused.current && !slippageInput) {
      return true;
    }
    if (!slippagePreset) {
      return !isWithinSlippageLimits;
    }

    // Priority Fee
    if (hasUnsavedFeeChanges && unsavedPriorityFee <= MINIMUM_PRIORITY_FEE) {
      return true;
    }

    return false;
  }, [hasUnsavedFeeChanges, isWithinSlippageLimits, slippageInput, slippagePreset, unsavedPriorityFee]);

  // method
  const onClickSave = useCallback(
    (values: Form) => {
      const { slippageInput, slippagePreset, asLegacyTransaction, preferredTokenListMode } = values;
      const value = slippageInput ? Number(slippageInput) : Number(slippagePreset);

      if (typeof value === 'number') {
        setForm((prev) => ({
          ...prev,
          slippageBps: value * 100,
        }));
      }

      setAsLegacyTransaction(asLegacyTransaction);
      setPreferredTokenListMode(preferredTokenListMode);
      // To save user slippage into local storage
      setUserSlippage(value);

      // Priority Fee
      if (hasUnsavedFeeChanges) {
        setPriorityFee(unsavedPriorityFee);
        setPriorityMode(unsavedPriorityMode);
        setPriorityLevel(unsavedPriorityLevel);
      }

      closeModal();
    },
    [
      closeModal,
      hasUnsavedFeeChanges,
      setAsLegacyTransaction,
      setForm,
      setPreferredTokenListMode,
      setPriorityFee,
      setPriorityLevel,
      setPriorityMode,
      setUserSlippage,
      unsavedPriorityFee,
      unsavedPriorityLevel,
      unsavedPriorityMode,
    ],
  );

  return (
    <div
      className={classNames(
        'w-full rounded-xl flex flex-col dark:bg-dark-900 bg-light-50 dark:text-grey-50 text-grey-700 shadow-xl max-h-[90%]',
      )}
    >
      <div className="flex justify-between items-center p-4 border-b border-white/10">
        <div className="text-sm font-semibold">
          <span>Swap Settings</span>
        </div>
        <div className="dark:text-grey-50 text-grey-700 fill-current cursor-pointer" onClick={() => closeModal()}>
          <CloseIcon width={14} height={14} />
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onClickSave)}
        className={classNames('relative w-full overflow-y-auto webkit-scrollbar overflow-x-hidden')}
      >
        <div>
          {/**************************** PRIORTY *****************************/}
          <div className={classNames('mt-2 px-5')}>
            <div className="flex items-center">
              <span className="text-sm font-semibold">Global Priority Fee</span>
              <Tooltip
                variant="dark"
                className="!left-0 !top-16 w-[50%]"
                content={
                  <span className="flex rounded-lg text-xs dark:text-grey-50 text-grey-500">
                    The priority fee is paid to the Solana network. This additional fee helps boost how a transaction is
                    prioritized against others, resulting in faster transaction execution times.
                  </span>
                }
              >
                <div className="flex ml-2.5 items-center text-white-35 fill-current">
                  <InfoIconSVG width={12} height={12} />
                </div>
              </Tooltip>
            </div>

            <p className="text-xs text-grey-400 font-[500] mt-2">
              These fees apply across Jupiter’s entire product suite, such as Swap, Perps, DCA, Limit Order
            </p>

            <div className="flex flex-col mt-2">
              <p className="text-xs font-semibold">Priority Mode</p>
              <div className="mt-2 flex items-center rounded-xl ring-1 ring-white/5 overflow-hidden">
                <Controller
                  name="unsavedPriorityMode"
                  control={form.control}
                  render={({ field: { onChange, value } }) => {
                    return (
                      <>
                        {Object.entries(PRIORITY_MODE_MAP).map(([level, name], idx) => {
                          return (
                            <SwapSettingButton
                              key={idx}
                              idx={idx}
                              itemsCount={Object.keys(PRIORITY_MODE_MAP).length}
                              roundBorder={
                                idx === 0
                                  ? 'left'
                                  : idx === Object.keys(PRIORITY_MODE_MAP).length - 1
                                    ? 'right'
                                    : undefined
                              }
                              highlighted={value === level}
                              onClick={() => {
                                form.setValue('hasUnsavedFeeChanges', true);
                                onChange(level);
                              }}
                            >
                              <div className="whitespace-nowrap px-4">
                                <p className="text-xs whitespace-nowrap dark:text-grey-50 text-grey-700">{name}</p>
                              </div>
                            </SwapSettingButton>
                          );
                        })}
                      </>
                    );
                  }}
                />
              </div>
            </div>

            <div
              className={`transition-height duration-300 ease-in-out animate-fade-in ${
                isMaxPriorityMode ? 'h-[76px] opacity-100' : 'h-0 opacity-0 overflow-hidden'
              }`}
            >
              <p className="text-xs font-semibold mt-4">Priority Level</p>
              <div className="flex items-center mt-2 rounded-xl ring-1 ring-white/5 overflow-hidden">
                <Controller
                  name="unsavedPriorityLevel"
                  control={form.control}
                  render={({ field: { value, onChange } }) => {
                    return (
                      <>
                        {Object.entries(PRIORITY_LEVEL_MAP).map(([level, name], idx) => {
                          return (
                            <SwapSettingButton
                              key={idx}
                              idx={idx}
                              itemsCount={Object.keys(PRIORITY_LEVEL_MAP).length}
                              roundBorder={
                                idx === 0
                                  ? 'left'
                                  : idx === Object.keys(PRIORITY_LEVEL_MAP).length - 1
                                    ? 'right'
                                    : undefined
                              }
                              highlighted={value === level}
                              onClick={() => {
                                form.setValue('hasUnsavedFeeChanges', true);
                                onChange(level);
                              }}
                            >
                              <div className="whitespace-nowrap">
                                <p className="text-sm dark:text-grey-50 text-grey-700">{name}</p>
                              </div>
                            </SwapSettingButton>
                          );
                        })}
                      </>
                    );
                  }}
                />
              </div>
            </div>

            <div className="text-xs text-grey-400">
              {isMaxPriorityMode ? (
                <>
                  <p>Jupiter intelligently minimizes and decides the best fee for you.</p>
                  <p>Set a max cap to prevent overpaying.</p>
                </>
              ) : (
                <p className="mt-2">Jupiter will use the exact fee you set.</p>
              )}
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between mt-4">
                {isMaxPriorityMode ? (
                  <p className="text-sm dark:text-grey-50 text-grey-700 font-[500]">Set Max Cap</p>
                ) : (
                  <p className="text-sm dark:text-grey-50 text-grey-700 font-[500]">Exact Fee</p>
                )}
                <span className="text-xxs mt-1 text-grey-400 font-normal self-end">
                  <CoinBalanceUSD
                    tokenInfo={SOL_TOKEN_INFO}
                    amount={unsavedPriorityFee?.toString()}
                    maxDecimals={4}
                    prefix="~"
                  />
                </span>
              </div>
              <div className={`relative mt-1`}>
                <Controller
                  name={'unsavedPriorityFee'}
                  control={form.control}
                  render={({ field: { value, onChange } }) => {
                    const thousandSeparator = detectedSeparator === ',' ? '.' : ',';

                    return (
                      <NumericFormat
                        value={value}
                        onValueChange={({ floatValue }) => {
                          if (typeof floatValue !== 'number') return;
                          form.setValue('hasUnsavedFeeChanges', true);
                          onChange(floatValue);
                        }}
                        onFocus={() => {
                          setIsPriorityFeeInputFocused(true);
                        }}
                        onBlur={() => {
                          setIsPriorityFeeInputFocused(false);
                        }}
                        inputMode="decimal"
                        decimalScale={9}
                        allowNegative={false}
                        thousandSeparator={thousandSeparator}
                        allowedDecimalSeparators={['.', ',']}
                        suffix=" SOL"
                        placeholder={'Enter custom value'}
                        className={`text-left h-full w-full dark:bg-navy-700 bg-light-100 placeholder:text-grey-400 py-4 px-5 text-sm rounded-xl ring-1 ring-white/5 dark:text-grey-50 text-grey-700 pointer-events-all relative focus:outline-none`}
                      />
                    );
                  }}
                />
              </div>
            </div>
            {isPrioritizationFeeLowerThanReferenceFee && (
              <InformationMessage
                iconSize={24}
                className="!text-orange-500 !px-0"
                message={
                  'Your current maximum fee is below the market rate. Please raise it to ensure your transactions are processed.'
                }
              />
            )}

            <Separator />

            {/* /**************************** SLIPPAGE **************************** */}
            <div className="flex items-center text-sm font-semibold">
              <span>Slippage Settings</span>
            </div>

            <div className="flex items-center mt-2.5 rounded-xl ring-1 ring-white/5 overflow-hidden text-sm">
              <Controller
                name="slippagePreset"
                control={form.control}
                render={({ field: { onChange, value } }) => {
                  return (
                    <>
                      {SLIPPAGE_PRESET.map((item, idx) => {
                        const displayText = formatNumber.format(Number(item)) + '%';

                        return (
                          <SwapSettingButton
                            key={idx}
                            idx={idx}
                            itemsCount={SLIPPAGE_PRESET.length}
                            className="h-full"
                            roundBorder={idx === 0 ? 'left' : undefined}
                            highlighted={!inputFocused.current && Number(value) === Number(item)}
                            onClick={() => {
                              inputFocused.current = false;
                              form.setValue('slippageInput', '');
                              onChange(item);
                            }}
                          >
                            {displayText}
                          </SwapSettingButton>
                        );
                      })}
                    </>
                  );
                }}
              />

              <div
                onClick={() => {
                  inputRef.current?.focus();
                  inputFocused.current = true;
                }}
                className={classNames(
                  `flex items-center justify-between cursor-text w-[120px] !h-[42px] dark:text-grey-50 text-grey-700 dark:bg-navy-700 bg-light-100 pl-2 text-sm relative`,
                  inputFocused.current ? 'border border-purple-500 rounded-r-xl' : '',
                )}
              >
                <span className="text-xs">
                  <span>Custom</span>
                </span>

                <Controller
                  name={'slippageInput'}
                  control={form.control}
                  render={({ field: { onChange, value } }) => {
                    return (
                      <NumericFormat
                        value={typeof value === 'undefined' ? '' : value}
                        decimalScale={2}
                        isAllowed={(value) => {
                          // This is for onChange events, we dont care about Minimum slippage here, to allow more natural inputs
                          return (value.floatValue || 0) <= 100 && (value.floatValue || 0) >= 0;
                        }}
                        getInputRef={(el: HTMLInputElement) => (inputRef.current = el)}
                        allowNegative={false}
                        onValueChange={({ value, floatValue }) => {
                          onChange(value);

                          // Prevent both slippageInput and slippagePreset to reset each oter
                          if (typeof floatValue !== 'undefined') {
                            form.setValue('slippagePreset', undefined);
                          }
                        }}
                        allowLeadingZeros={false}
                        suffix="%"
                        className="w-full dark:bg-navy-700 bg-light-100 pr-4 text-sm rounded-lg placeholder:text-grey-400 dark:text-grey-50 text-grey-700 text-right pointer-events-all focus:outline-none"
                        decimalSeparator={detectedSeparator}
                        placeholder={detectedSeparator === ',' ? '0,00%' : '0.00%'}
                      />
                    );
                  }}
                />
              </div>
            </div>

            <div>
              {inputFocused.current && !isWithinSlippageLimits && (
                <InformationMessage
                  iconSize={14}
                  className="!text-orange-500 !px-0"
                  message={`Please set a slippage value that is within ${MINIMUM_SLIPPAGE}% to ${MAXIMUM_SLIPPAGE}%`}
                />
              )}

              {slippageSuggestionText && (
                <InformationMessage iconSize={14} className="!text-orange-500 !px-0" message={slippageSuggestionText} />
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-semibold">Versioned Tx.</p>

                <a
                  href="https://docs.jup.ag/docs/additional-topics/composing-with-versioned-transaction#what-are-versioned-transactions"
                  rel="noreferrer"
                  target={'_blank'}
                  className="cursor-pointer"
                >
                  <ExternalIcon />
                </a>
              </div>

              <Toggle
                active={!asLegacyTransactionInput}
                onClick={() => form.setValue('asLegacyTransaction', !asLegacyTransactionInput)}
              />
            </div>
            <p className="mt-2 text-xs text-grey-400">
              Versioned Tx is a significant upgrade that allows for more advanced routings and better prices!
            </p>

            {wallet?.adapter ? (
              <p className="mt-2 text-xs text-grey-400">
                {detectedVerTxSupport
                  ? `Your wallet supports Versioned Tx. and it has been turned on by default.`
                  : `Your wallet does not support Versioned Tx.`}
              </p>
            ) : null}

            <Separator />

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-semibold">Strict Token list</p>

                <a
                  href="https://docs.jup.ag/docs/token-list/token-list-api"
                  rel="noreferrer"
                  target={'_blank'}
                  className="cursor-pointer"
                >
                  <ExternalIcon />
                </a>
              </div>
              <Toggle
                active={preferredTokenListModeInput === 'strict'}
                onClick={() =>
                  form.setValue('preferredTokenListMode', preferredTokenListModeInput === 'strict' ? 'all' : 'strict')
                }
              />
            </div>
            <p className="mt-2 text-xs text-grey-400">
              {`The strict list contains a smaller set of validated tokens. To see all tokens, toggle "off".`}
            </p>
          </div>

          <div className="px-5 pb-5">
            <JupButton type="submit" className={'w-full mt-4'} disabled={isButtonDisabled} size={'lg'}>
              <span>Save Settings</span>
            </JupButton>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SwapSettingsModal;
