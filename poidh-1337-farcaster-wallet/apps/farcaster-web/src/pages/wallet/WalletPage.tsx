import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { WalletIcon } from '~/components/icons/WalletIcon';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

type WindowWithEthereum = Window & { ethereum?: Eip1193Provider };

const BASE_CHAIN_ID = '0x2105';

const shortenAddress = (address: string) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

const formatEther = (hexWei: string) => {
  const wei = BigInt(hexWei);
  const whole = wei / 10n ** 18n;
  const fraction = (wei % 10n ** 18n)
    .toString()
    .padStart(18, '0')
    .slice(0, 5)
    .replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
};

const parseEther = (value: string) => {
  if (!/^\d+(\.\d{0,18})?$/.test(value)) {
    throw new Error('Enter a valid ETH amount');
  }
  const [whole, fraction = ''] = value.split('.');
  const wei = BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, '0'));
  return `0x${wei.toString(16)}`;
};

const WalletPage = memo(() => {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('');
  const [chainId, setChainId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('Connect an injected EVM wallet to begin.');
  const [busy, setBusy] = useState(false);

  const provider = useMemo(
    () => (typeof window === 'undefined' ? undefined : (window as WindowWithEthereum).ethereum),
    [],
  );

  const refresh = useCallback(
    async (nextAddress?: string) => {
      if (!provider) return;
      const accounts = (await provider.request({ method: 'eth_accounts' })) as string[];
      const account = nextAddress ?? accounts[0] ?? '';
      setAddress(account);

      const nextChainId = (await provider.request({ method: 'eth_chainId' })) as string;
      setChainId(nextChainId);

      if (account) {
        const nextBalance = (await provider.request({
          method: 'eth_getBalance',
          params: [account, 'latest'],
        })) as string;
        setBalance(formatEther(nextBalance));
      } else {
        setBalance('');
      }
    },
    [provider],
  );

  useEffect(() => {
    if (!provider?.on) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = (args[0] as string[]) ?? [];
      void refresh(accounts[0] ?? '');
    };
    const handleChainChanged = () => void refresh();

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);
    void refresh();

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [provider, refresh]);

  const connect = async () => {
    if (!provider) {
      setStatus('No injected wallet found. Install or open an EVM wallet browser extension.');
      return;
    }

    setBusy(true);
    try {
      const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
      await refresh(accounts[0]);
      setStatus('Wallet connected. Keys stay inside your wallet provider.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Wallet connection failed.');
    } finally {
      setBusy(false);
    }
  };

  const switchToBase = async () => {
    if (!provider) return;
    setBusy(true);
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_CHAIN_ID }],
      });
      await refresh();
      setStatus('Switched to Base.');
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: BASE_CHAIN_ID,
              chainName: 'Base',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org'],
            },
          ],
        });
        await refresh();
        setStatus('Base added and selected.');
      } else {
        setStatus(error instanceof Error ? error.message : 'Unable to switch network.');
      }
    } finally {
      setBusy(false);
    }
  };

  const sendEth = async () => {
    if (!provider || !address) return;
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      setStatus('Enter a valid EVM recipient address.');
      return;
    }

    setBusy(true);
    try {
      const txHash = (await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: address,
            to: recipient,
            value: parseEther(amount),
          },
        ],
      })) as string;
      setStatus(`Transaction submitted: ${txHash}`);
      setAmount('');
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Transaction failed.');
    } finally {
      setBusy(false);
    }
  };

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setStatus('Address copied.');
  };

  return (
    <Page meta={{ title: 'Wallet / Farcaster' }}>
      <div className="border-default sm:border-x">
        <PageHeader hideCastButton>
          <div className="flex items-center">
            <PageTitle>Wallet</PageTitle>
          </div>
        </PageHeader>
      </div>
      <BorderedMainContent className="flex flex-row p-6">
        <SettingsPageContent>
          <div className="flex w-full flex-col gap-4 rounded-2xl bg-elevated-nohover p-5">
            <div className="flex items-center gap-3">
              <WalletIcon />
              <div>
                <div className="text-lg font-semibold">Farcaster Web Wallet</div>
                <div className="text-sm text-muted">
                  Uses your injected EIP-1193 wallet. Farcaster never receives a private key.
                </div>
              </div>
            </div>

            {!provider && (
              <div className="rounded-xl border border-default p-4 text-sm">
                No injected EVM provider detected. Open this page with MetaMask, Rabby,
                Coinbase Wallet, or another EIP-1193 compatible wallet.
              </div>
            )}

            {!address ? (
              <button
                className="rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50"
                disabled={busy || !provider}
                onClick={() => void connect()}
                type="button"
              >
                {busy ? 'Connecting…' : 'Connect wallet'}
              </button>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-default p-4">
                    <div className="text-xs uppercase text-muted">Address</div>
                    <div className="mt-1 font-mono text-base">{shortenAddress(address)}</div>
                    <button className="mt-2 text-sm font-semibold" onClick={() => void copyAddress()} type="button">
                      Copy address
                    </button>
                  </div>
                  <div className="rounded-xl border border-default p-4">
                    <div className="text-xs uppercase text-muted">Balance</div>
                    <div className="mt-1 text-2xl font-semibold">{balance || '0'} ETH</div>
                    <div className="mt-1 text-xs text-muted">Chain ID {chainId || '—'}</div>
                  </div>
                </div>

                {chainId !== BASE_CHAIN_ID && (
                  <button
                    className="rounded-xl border border-default px-4 py-3 font-semibold disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void switchToBase()}
                    type="button"
                  >
                    Switch to Base
                  </button>
                )}

                <div className="rounded-xl border border-default p-4">
                  <div className="mb-3 font-semibold">Send ETH</div>
                  <div className="flex flex-col gap-3">
                    <input
                      className="rounded-xl border border-default bg-transparent px-3 py-2 font-mono"
                      onChange={(event) => setRecipient(event.target.value.trim())}
                      placeholder="0x recipient"
                      value={recipient}
                    />
                    <input
                      className="rounded-xl border border-default bg-transparent px-3 py-2"
                      inputMode="decimal"
                      onChange={(event) => setAmount(event.target.value.trim())}
                      placeholder="0.001"
                      value={amount}
                    />
                    <button
                      className="rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50"
                      disabled={busy || !amount || !recipient}
                      onClick={() => void sendEth()}
                      type="button"
                    >
                      {busy ? 'Waiting for wallet…' : 'Review in wallet'}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="break-all rounded-xl bg-default px-3 py-2 text-xs">{status}</div>
          </div>
        </SettingsPageContent>
      </BorderedMainContent>
    </Page>
  );
});

WalletPage.displayName = 'WalletPage';

export { WalletPage };
