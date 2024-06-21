import { TokenInfo } from '@solana/spl-token-registry';
import classNames from 'classnames';
import React, { createRef, memo, useEffect, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { areEqual, FixedSizeList, ListChildComponentProps } from 'react-window';
import LeftArrowIcon from 'src/icons/LeftArrowIcon';
import SearchIcon from 'src/icons/SearchIcon';
import { PAIR_SELECTOR_TOP_TOKENS } from 'src/misc/constants';

import { useAccounts } from '../contexts/accounts';

import FormPairRow from './FormPairRow';
import { useUSDValueProvider } from 'src/contexts/USDValueProvider';
import Decimal from 'decimal.js';

export const PAIR_ROW_HEIGHT = 72;
const SEARCH_BOX_HEIGHT = 56;

// eslint-disable-next-line react/display-name
const rowRenderer = memo((props: ListChildComponentProps) => {
  const { data, index, style } = props;
  const item = data.searchResult[index];

  return <FormPairRow key={item.address} item={item} style={style} onSubmit={data.onSubmit} />;
}, areEqual);

const FormPairSelector = ({
  onSubmit,
  tokenInfos,
  onClose,
}: {
  onSubmit: (value: TokenInfo) => void;
  onClose: () => void;
  tokenInfos: TokenInfo[];
}) => {
  const { accounts } = useAccounts();
  const { tokenPriceMap } = useUSDValueProvider();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<TokenInfo[]>(tokenInfos);
  useEffect(() => {
    const sortedList = tokenInfos
      .sort((a, b) => {
        return PAIR_SELECTOR_TOP_TOKENS.includes(a.address) && !PAIR_SELECTOR_TOP_TOKENS.includes(b.address) ? -1 : 1;
      })
      .sort((a, b) => {
        if (!accounts[a.address]) return 1;
        if (!accounts[b.address]) return -1;

        const [tokenAPrice, tokenBPrice] = [tokenPriceMap[a.address]?.usd, tokenPriceMap[b.address]?.usd];

        // Sort by USD value
        if (tokenAPrice && tokenBPrice) {
          const totalAValue = new Decimal(tokenAPrice).mul(accounts[a.address].balance);
          const totalBValue = new Decimal(tokenBPrice).mul(accounts[b.address].balance);
          return totalBValue.gt(totalAValue) ? 1 : -1;
        }

        // If no usd value, sort by balance
        return accounts[b.address].balance - accounts[a.address].balance;
      });

    if (searchTerm) {
      const filteredList = sortedList.filter(
        (item) =>
          item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.address.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setSearchResult(filteredList);
    } else {
      setSearchResult(sortedList);
    }
  }, [accounts, tokenInfos, searchTerm, tokenPriceMap]);

  const listRef = createRef<FixedSizeList>();
  const inputRef = createRef<HTMLInputElement>();
  useEffect(() => inputRef.current?.focus(), [inputRef]);

  return (
    <div className="flex flex-col h-full w-full p-4 dark:bg-dark-900 bg-light-50">
      <div className="flex w-full justify-between">
        <div className="dark:text-grey-50 text-grey-700 fill-current w-6 h-6 cursor-pointer" onClick={onClose}>
          <LeftArrowIcon width={24} height={24} />
        </div>

        <div className="dark:text-grey-50 text-grey-700">Select Token</div>

        <div className=" w-6 h-6" />
      </div>

      <div
        className="flex px-6 mt-4 w-[98%] rounded-xl dark:bg-navy-700 bg-light-100"
        style={{ height: SEARCH_BOX_HEIGHT, maxHeight: SEARCH_BOX_HEIGHT }}
      >
        <SearchIcon />

        <input
          autoComplete="off"
          className="w-full rounded-xl ml-4 truncate bg-transparent dark:text-grey-50 text-grey-700 placeholder:text-grey-400 focus:outline-none"
          placeholder={`Search`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          ref={inputRef}
        />
      </div>

      <div className="mt-2 rounded-md" style={{ flexGrow: 1 }}>
        {searchResult.length > 0 && (
          <AutoSizer>
            {({ height, width }: { height: number; width: number }) => {
              return (
                <FixedSizeList
                  ref={listRef}
                  height={height}
                  itemCount={searchResult.length}
                  itemSize={PAIR_ROW_HEIGHT}
                  width={width - 2} // -2 for scrollbar
                  itemData={{
                    searchResult,
                    onSubmit,
                  }}
                  className={classNames('overflow-y-scroll mr-1 min-h-[12rem] px-5')}
                >
                  {rowRenderer}
                </FixedSizeList>
              );
            }}
          </AutoSizer>
        )}

        {searchResult.length === 0 ? (
          <div className="mt-4 mb-4 text-center text-grey-400">
            <span>No tokens found</span>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default FormPairSelector;
