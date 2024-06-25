import React, { useMemo, useState } from 'react';
import { Connection } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { useConnection } from '@jup-ag/wallet-adapter';
import { useAtom } from 'jotai';
import { appProps } from 'src/library';

const PERFORMANCE_SAMPLE_LIMIT = 6;
const MIN_RECOMMENDED_TPS = 1500;
const getAvgTPS = async (connection: Connection) => {
  try {
    // Performance samples are taken every 60 seconds and include the number of transactions and slots that occur in a given time window.
    const samples = await connection.getRecentPerformanceSamples(PERFORMANCE_SAMPLE_LIMIT);

    let sums = samples.reduce(
      (sums, sample) => {
        if (sample.numTransactions !== 0) {
          sums.numTransactions += sample.numTransactions;
          sums.samplePeriodSecs += sample.samplePeriodSecs;
        }
        return sums;
      },
      { numTransactions: 0, samplePeriodSecs: 0 },
    );
    const avgTps = sums.numTransactions / (sums.samplePeriodSecs || 1);
    return avgTps;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

const useTPSMonitor = () => {
  const [tps, setTPS] = useState<number[]>([]);
  const { connection } = useConnection();
  const [atom] = useAtom(appProps);
  const isTerminalInDOM = atom?.integratedTargetId ? Boolean(document.getElementById(atom?.integratedTargetId)) : false;

  useQuery(
    ['tps-monitor'],
    async () => {
      let newValue: number = 0;

      try {
        newValue = await getAvgTPS(connection);
      } catch (error) {
        // Ignore fetch error, will push 0 to tps array.
      } finally {
        setTPS((prev) => {
          const prevValue = [...prev];

          // Only save up to 3 items
          if (prevValue?.length === 3) {
            prevValue.shift();
          }
          prevValue.push(newValue);
          return prevValue;
        });
      }

      // Purposely throw to trigger refetching faster
      if (newValue <= MIN_RECOMMENDED_TPS) {
        throw new Error('Low TPS');
      }

      // Purposely return null to silence useQuery error
      return null;
    },
    {
      // ensure useQuery only runs when terminal is in DOM
      refetchInterval: isTerminalInDOM ? 15_000 : false,
      refetchIntervalInBackground: false,
      // linear delay if calls fail
      retryDelay: attempt => attempt * 3000,
      enabled: isTerminalInDOM ? true : false,
    },
  );

  const isLowTPS = useMemo(() => {
    return tps.length > 0 && tps.every((item) => item <= MIN_RECOMMENDED_TPS);
  }, [tps]);

  const isRPCDown = useMemo(() => {
    return tps.length === 3 && tps.every((item) => item === 0);
  }, [tps]);

  const message = useMemo(() => {
    if (isRPCDown) {
      return (
        <span className="flex text-xs justify-center items-center text-left">
          <div className="ml-1 text-rock">
            <span>
              <span>Your RPC is not responding to any requests.</span>
            </span>
          </div>
        </span>
      );
    }

    if (isLowTPS) {
      return (
        <span className="flex text-xs justify-center items-center text-left">
          <div className="ml-1 text-rock">
            <span>
              <span>
                Solana network is experiencing degraded performance. Transactions may fail to send or confirm.
              </span>
            </span>
          </div>
        </span>
      );
    }

    return null;
  }, [isLowTPS, isRPCDown]);

  return { isLowTPS, isRPCDown, message };
};

export default useTPSMonitor;
