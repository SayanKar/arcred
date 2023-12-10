import creditContractAbi from './CreditContractABI.json';

export const CREDIT_CONTRACT_ADDRESS = '0xc8DE330195eDb6B68B3edEAE6F8593Cf82489643';
export const { abi: CREDIT_CONTRACT_ABI } = creditContractAbi;

export const ADDRESSES: {[key in SupportedChainIds]: string} = {
    "0x1389": "0xE39C3C75f3585B38F4a7436F814F4Bd4209c9569",
    "0xAEF3": "0xE39C3C75f3585B38F4a7436F814F4Bd4209c9569",
    "0x82751": "0xE39C3C75f3585B38F4a7436F814F4Bd4209c9569",
}

export enum SupportedChainIds {
    MANTLE = "0x1389",
    CELO = "0xAEF3",
    SCROLL = "0x82751",
    // POLYGON = "0x13881",
    // FUJI = "0xA869",
    // GOERLI = "0x5",
}