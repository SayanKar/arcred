import supportedConfigs from './config.json'

declare global {
    interface Window {
      ethereum: any;
    }
  }

type ChainConfig = {
    chainId: string,
    chainName: string,
    symbol: string,
    decimals: number,
    rpcUrls: string[],
    blockExplorerUrls: string[],
    minimumWalletBalance: number
}

type IsValidChainIdResponse = {
    isValid: boolean,
    chain: ChainConfig | undefined
}

function stringToHex(str: string): string {
    return str.split('').map(char => char.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}

function isEthereum() {
    if (window.ethereum) {
        return true;
    }
    return false;
}

function isValidChainId(chainId: string) {
    const response: IsValidChainIdResponse = {isValid: false, chain: undefined}

    if(isNaN(parseInt(chainId))) {
        return response
    }

    supportedConfigs.forEach((chain) => {
        if(chain.chainId.toLowerCase() === chainId.toLowerCase()) {
            response.isValid = true
            response.chain = chain
        }
    })

    return response
}

function getChainID() {
    if (isEthereum()) {
        return window.ethereum.chainId?.toString();
    }
    return 0;
}

async function handleConnection(accounts: any) {
    if (accounts?.length === 0) {
        const fetchedAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        return fetchedAccounts;
    }

    return accounts;
}

// requests account access from users and fetch the first connected account
async function requestAccount() {
    let currentAccount = '0x0';
    if (isEthereum() && getChainID() !== 0) {
        let accounts = await window.ethereum.request({ method: 'eth_accounts' }).catch(console.error);
        accounts = await handleConnection(accounts).catch(console.error);
        currentAccount = accounts?.[0];
    }
    return currentAccount;
}

// returns balance for an account
async function requestBalance(currentAccount: any) {
    let currentBalance;
    if (isEthereum()) {
        try {
            currentBalance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [currentAccount, 'latest'],
            });

            currentBalance = parseInt(currentBalance, 16) / 1e18;

            return { currentBalance: currentBalance.toString(), err: false };
        } catch (err) {
            return { currentBalance, err: true };
        }
    }   
    return { currentBalance, err: true };
}

// get all necessary params from the metamask like address, balance, chainId
export const GetParams = async () => {
    const response = {
        isError: false,
        message: '',
        step: -1,
        balance: 0,
        account: '0x0',
        chainId: ''
    };

    if (!isEthereum()) {
        response.step = 0;
        return response;
    }

    try {
        const currentAccount = await requestAccount();
        if (!currentAccount || currentAccount === '0x0') {
            response.step = 1;
            return response;
        }

        response.account = currentAccount;

        const {isValid, chain} = isValidChainId(getChainID())

        if (!isValid || !chain) {
            response.step = 2;
            return response;
        }
        response.chainId = chain.chainId

        const { currentBalance, err } = await requestBalance(currentAccount);
        if (err) {
            response.isError = true;
            response.message = 'Error fetching balance!';
            return response;
        }
        response.balance = currentBalance;

        if (currentBalance < chain.minimumWalletBalance ?? 0) {
            response.step = 3;
            return response;
        }
    } catch(err) {
        console.log("Inside err", err)
    }

    return response;
};

// swtiches network to a valid chain
export async function switchNetwork(chainId: string) {
    const {isValid, chain} = isValidChainId(chainId)
    if(isValid) {
        await window?.ethereum?.request({
            method: 'wallet_addEthereumChain',
            params: [
                {
                    chainId: chain?.chainId,
                    chainName: chain?.chainName,
                    nativeCurrency: {
                        name: chain?.chainName,
                        symbol: chain?.symbol,
                        decimals: chain?.decimals ?? 18,
                    },
                    rpcUrls: chain?.rpcUrls,
                    blockExplorerUrls: chain?.blockExplorerUrls,
                }
            ],
        }).catch((error: any) => {
            console.log(error);
        });
    } else {
        alert('Unsupported or invalid chain!')
    }
}