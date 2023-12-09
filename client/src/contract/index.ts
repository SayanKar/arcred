import creditContractAbi from './CreditContractABI.json';

export const CREDIT_CONTRACT_ADDRESS = '0xc8DE330195eDb6B68B3edEAE6F8593Cf82489643';
export const { abi: DATA_CONTRACT_ABI } = creditContractAbi;

export const ADDRESSES: {[key in SupportedChainIds]: string} = {
    "0x1389": "0x8CcF9313acAc383e8B899141B14e9DCc5244C609",
    "0xAEF3": "0x8f2798cd64CC140dAF3A80BAe1d458bc9b7ccD61",
    "0x82751": "0xc8DE330195eDb6B68B3edEAE6F8593Cf82489643",
    "0x66EED": "0xc8DE330195eDb6B68B3edEAE6F8593Cf82489643",
}

export enum SupportedChainIds {
    MANTLE = "0x1389",
    CELO = "0xAEF3",
    SCROLL = "0x82751",
    ARBITRUM = "0x66EED",
}