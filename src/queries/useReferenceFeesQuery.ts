import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { appProps } from 'src/library';

interface Fee {
  /**
   * @description medium
   */
  m: number;
  /**
   * @description high
   */
  h: number;
  /**
   * @description very high
   */
  vh: number;
}

interface MarketReferenceFee {
  claim: number;
  jup: Fee;
  jup2: Fee;
  loAndDCA: number;
  referral: number;
  perps: Fee;
  swapFee: number;
  lastUpdatedAt: number;
}

export const useReferenceFeesQuery = () => {
  const [atom] = useAtom(appProps);
  const isTerminalInDOM = atom?.integratedTargetId ? Boolean(document.getElementById(atom?.integratedTargetId)) : false;

  return useQuery(
    ['market-reference-fees'],
    async () => {
      const data = (await fetch('https://cache.jup.ag/reference-fees')).json() as unknown as MarketReferenceFee;
      return data;
    },
    {
      keepPreviousData: true,
      refetchInterval: isTerminalInDOM ? 60_000 : false,
      refetchIntervalInBackground: false,
      retry: false,
      retryOnMount: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // ensure useQuery only runs when terminal is in DOM
      enabled: isTerminalInDOM ? true : false,
    },
  );
};
