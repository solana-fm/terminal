import React, { useCallback } from 'react';
import { useScreenState } from 'src/contexts/ScreenProvider';
import { useSwapContext } from 'src/contexts/SwapContext';
import LeftArrowIcon from 'src/icons/LeftArrowIcon';
import useTimeDiff from '../useTimeDiff/useTimeDiff';
import PriceInfo from '../PriceInfo/index';
import JupButton from '../JupButton';
import V2SexyChameleonText from '../SexyChameleonText/V2SexyChameleonText';

const ConfirmationScreen = () => {
  const {
    fromTokenInfo,
    toTokenInfo,
    onSubmit: onSubmitJupiter,
    onRequestIx,
    quoteResponseMeta,
    jupiter: { loading, refresh },
  } = useSwapContext();

  const [hasExpired] = useTimeDiff();

  const { setScreen } = useScreenState();

  const onGoBack = () => {
    refresh();
    setScreen('Initial');
  };
  const onSubmit = useCallback(async () => {
    setScreen('Swapping');

    if (window.Jupiter.onRequestIxCallback) {
      const ixAndCb = await onRequestIx();
      if (ixAndCb) {
        window.Jupiter.onRequestIxCallback(ixAndCb);
      } else {
        setScreen('Error');
      }
    } else {
      onSubmitJupiter();
    }
  }, [onRequestIx, onSubmitJupiter, setScreen]);

  return (
    <div className="flex flex-col h-full w-full py-4 px-2">
      <div className="flex w-full justify-between">
        <div className="dark:text-grey-50 text-grey-700 fill-current w-6 h-6 cursor-pointer" onClick={onGoBack}>
          <LeftArrowIcon width={24} height={24} />
        </div>

        <div className="dark:text-grey-50 text-grey-700">Review Order</div>

        <div className=" w-6 h-6" />
      </div>

      <div>
        {quoteResponseMeta && fromTokenInfo && toTokenInfo ? (
          <PriceInfo
            quoteResponse={quoteResponseMeta.quoteResponse}
            fromTokenInfo={fromTokenInfo}
            toTokenInfo={toTokenInfo}
            loading={loading}
            showFullDetails
            containerClassName="dark:bg-dark-700 dark:opacity-70 bg-light-400 border-none"
          />
        ) : null}
      </div>

      {hasExpired ? (
        <JupButton size="lg" className="w-full mt-4 disabled:opacity-50 !p-0" type="button" onClick={onGoBack}>
          <span className="text-sm dark:text-grey-50 text-grey-700">Refresh</span>
        </JupButton>
      ) : (
        <JupButton size="lg" className="w-full mt-4 disabled:opacity-50" type="button" onClick={onSubmit}>
          {/* <V2SexyChameleonText>Confirm</V2SexyChameleonText> */}
          <span className="text-purple-50">Confirm</span>
        </JupButton>
      )}
    </div>
  );
};

export default ConfirmationScreen;
