// sfm version of Price Info List component
// include loading states and default display of values
import { ZERO } from '@jup-ag/math';
import { QuoteResponse, SwapMode, TransactionFeeInfo, calculateFeeForSwap } from '@jup-ag/react-hook';
import { TokenInfo } from '@solana/spl-token-registry';
import classNames from 'classnames';
import Decimal from 'decimal.js';
import JSBI from 'jsbi';
import { useEffect, useMemo, useState } from 'react';
import { usePrioritizationFee } from 'src/contexts/PrioritizationFeeContextProvider';
import { useWalletPassThrough } from 'src/contexts/WalletPassthroughProvider';
import { useAccounts } from 'src/contexts/accounts';
import { formatNumber } from 'src/misc/utils';
import ExchangeRate from './ExchangeRate';
import Fees from './PriceInfo/Fees';
import TransactionFee from './PriceInfo/TransactionFee';
import Deposits from './PriceInfo/Deposits';
import PlatformFees, { PlatformFeesInfo } from './PriceInfo/PlatformFees';
import { useSwapContext } from 'src/contexts/SwapContext';
import { Skeleton } from './Skeleton';

const PriceInfoV2 = ({
    quoteResponse,
    fromTokenInfo,
    toTokenInfo,
    loading,
    showFullDetails = false,
    containerClassName,
}: {
    quoteResponse: QuoteResponse | undefined;
    fromTokenInfo: TokenInfo;
    toTokenInfo: TokenInfo;
    loading: boolean;
    showFullDetails?: boolean;
    containerClassName?: string;
}) => {
    // to check if form input from value is filled => differentiate user input with default set value
    const { form } = useSwapContext();

    const rateParams = {
        inAmount: quoteResponse?.inAmount || ZERO, // If there's no selectedRoute, we will use first route value to temporarily calculate
        inputDecimal: fromTokenInfo.decimals,
        outAmount: quoteResponse?.outAmount || ZERO, // If there's no selectedRoute, we will use first route value to temporarily calculate
        outputDecimal: toTokenInfo.decimals,
    };

    const { accounts } = useAccounts();

    const { wallet } = useWalletPassThrough();
    const walletPublicKey = useMemo(() => wallet?.adapter.publicKey?.toString(), [wallet?.adapter.publicKey]);

    const priceImpact = formatNumber.format(new Decimal(quoteResponse?.priceImpactPct || 0).mul(100).toDP(4).toNumber());
    const priceImpactText = Number(priceImpact) < 0.1 ? `< ${formatNumber.format(0.1)}%` : `~ ${priceImpact}%`;

    const otherAmountThresholdText = useMemo(() => {
        if (quoteResponse?.otherAmountThreshold && form.fromValue) {
            const amount = new Decimal(quoteResponse.otherAmountThreshold.toString()).div(Math.pow(10, toTokenInfo.decimals));

            const amountText = formatNumber.format(amount.toNumber());
            return `${amountText} ${toTokenInfo.symbol}`;
        }
        return undefined;
    }, [quoteResponse?.otherAmountThreshold, toTokenInfo.decimals, toTokenInfo.symbol, form.fromValue]);

    const [feeInformation, setFeeInformation] = useState<TransactionFeeInfo>();

    const mintToAccountMap = useMemo(() => {
        return new Map(Object.entries(accounts).map((acc) => [acc[0], acc[1].pubkey.toString()]));
    }, [accounts]);

    useEffect(() => {
        if (quoteResponse) {
            const fee = calculateFeeForSwap(
                quoteResponse,
                mintToAccountMap,
                new Map(), // we can ignore this as we are using shared accounts
                true,
                true,
            );
            setFeeInformation(fee);
        } else {
            setFeeInformation(undefined);
        }
    }, [quoteResponse, walletPublicKey, mintToAccountMap]);

    const hasAtaDeposit = (feeInformation?.ataDeposits.length ?? 0) > 0;
    const hasSerumDeposit = (feeInformation?.openOrdersDeposits.length ?? 0) > 0;

    const { priorityFee } = usePrioritizationFee();

    return (
        <div className={classNames('mt-4 flex flex-col gap-5 rounded-xl p-3', containerClassName)}>
            <div className="flex items-center justify-between text-xs">
                <div className="text-grey-400">{<span>Rate</span>}</div>
                {JSBI.greaterThan(rateParams.inAmount, ZERO) && JSBI.greaterThan(rateParams.outAmount, ZERO) ? (
                    <ExchangeRate
                        loading={loading}
                        rateParams={rateParams}
                        fromTokenInfo={fromTokenInfo}
                        toTokenInfo={toTokenInfo}
                        reversible={true}
                    />
                ) : (
                    <span className="dark:text-grey-50 text-grey-700">{'-'}</span>
                )}
            </div>

            <div className="flex items-center justify-between text-xs">
                <div>
                    <span className="text-grey-400">Price Impact</span>
                </div>
                <div className="dark:text-grey-50 text-grey-700">{priceImpactText}</div>
            </div>

            <div className="flex items-center justify-between text-xs">
                <div className="text-grey-400">
                    {quoteResponse?.swapMode === SwapMode.ExactIn ? <span>Minimum Received</span> : <span>Maximum Consumed</span>}
                </div>
                {loading && form.fromValue ? (
                    <Skeleton className="w-[80px] h-4" />
                ) : (
                    <div className="dark:text-grey-50 text-grey-700">
                        {otherAmountThresholdText ? otherAmountThresholdText : "-"}
                    </div>
                )}
            </div>

            {showFullDetails ? (
                <>
                    <Fees routePlan={quoteResponse?.routePlan} swapMode={quoteResponse?.swapMode as SwapMode} />
                    <TransactionFee feeInformation={feeInformation} />
                    <Deposits hasSerumDeposit={hasSerumDeposit} hasAtaDeposit={hasAtaDeposit} feeInformation={feeInformation} />
                    {(quoteResponse as QuoteResponse & PlatformFeesInfo).platformFee ? (
                        <PlatformFees
                            platformFee={(quoteResponse as QuoteResponse & PlatformFeesInfo).platformFee}
                            tokenInfo={quoteResponse?.swapMode === SwapMode.ExactIn ? toTokenInfo : fromTokenInfo}
                        />
                    ) : null}

                    {priorityFee > 0 ? (
                        <div className="flex items-center justify-between text-xs">
                            <div className="text-grey-400">Max Priority Fee</div>
                            <div className="dark:text-grey-50 text-grey-700">{priorityFee} SOL</div>
                        </div>
                    ) : null}
                </>
            ) : null}
        </div>
    );
};

export default PriceInfoV2;