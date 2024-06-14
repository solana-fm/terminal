import React, { useMemo } from 'react';
import { TransactionFeeInfo } from '@jup-ag/react-hook';
import Tooltip from 'src/components/Tooltip';
import { formatNumber, fromLamports } from 'src/misc/utils';

const TransactionFee = ({ feeInformation }: { feeInformation: TransactionFeeInfo | undefined }) => {
  const feeText = useMemo(() => {
    if (feeInformation) {
      return formatNumber.format(fromLamports(feeInformation.signatureFee, 9));
    }
    return '-';
  }, [feeInformation]);

  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex w-[50%] text-grey-400">
        <span>Transaction Fee</span>
        <Tooltip content={<span>This is for Solana transaction fee</span>}>
          <span className="ml-1 cursor-pointer">[?]</span>
        </Tooltip>
      </div>
      <div className="dark:text-grey-50 text-grey-700">{feeText} SOL</div>
    </div>
  );
};

export default TransactionFee;
