import { TokenInfo } from '@solana/spl-token-registry';
import React, { CSSProperties, useMemo } from 'react';

import CoinBalance from './Coinbalance';
import { PAIR_ROW_HEIGHT } from './FormPairSelector';
import TokenIcon from './TokenIcon';
import TokenLink from './TokenLink';
import { useUSDValueProvider } from 'src/contexts/USDValueProvider';
import Decimal from 'decimal.js';
import { useAccounts } from 'src/contexts/accounts';

const FormPairRow: React.FC<{
  item: TokenInfo;
  style: CSSProperties;
  onSubmit(item: TokenInfo): void;
}> = ({ item, style, onSubmit }) => {
  const isUnknown = useMemo(() => item.tags?.length === 0 || item.tags?.includes('unknown'), [item.tags]);

  const { accounts } = useAccounts();
  const { tokenPriceMap } = useUSDValueProvider();

  const totalUsdValue = useMemo(() => {
    const tokenPrice = tokenPriceMap[item.address]?.usd;
    const balance = accounts[item.address]?.balance;
    if (!tokenPrice || !balance) return null;

    const totalAValue = new Decimal(tokenPrice).mul(balance);
    return totalAValue;
  }, [accounts, item.address, tokenPriceMap]);

  return (
    <li className={`cursor-pointer list-none h-full border-b dark:border-navy-600 border-navy-50`} style={style} translate="no">
      <div
        className="flex flex-row gap-4 items-center px-5 py-3 justify-between dark:hover:bg-navy-600 hover:bg-light-400 h-full"
        onClick={() => onSubmit(item)}
      >
        <div className="h-7 w-7 rounded-full shrink-0">
          <TokenIcon tokenInfo={item} width={28} height={28} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-row items-center space-x-2">
            <p className="text-sm font-medium dark:text-grey-50 text-grey-700 truncate">{item.symbol}</p>
            <TokenLink tokenInfo={item} />
          </div>

          <div className="mt-1 text-xs text-gray-500 truncate flex space-x-1">
            <CoinBalance mintAddress={item.address} />

            {totalUsdValue && totalUsdValue.gt(0.01) ? (
              <span className="ml-1">| ${totalUsdValue.toFixed(2)}</span>
            ) : null}
          </div>
        </div>

        {isUnknown ? (
          <p className="ml-auto text-xs py-[1px] px-1 text-orange-300">
            <span>Unknown</span>
          </p>
        ) : null}
      </div>
    </li>
  );
};

export default FormPairRow;
