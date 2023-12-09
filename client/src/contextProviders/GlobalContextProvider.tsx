import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import { ethers } from 'ethers'
import { GetParams } from '../onboarding/onboard';
import { ADDRESSES, SupportedChainIds } from '../contract';

interface IGlobalContext {
    provider?: ethers.providers.Web3Provider,
    contract?: ethers.ContractInterface,
    account?: string,
    chainId?: any,
}

const GlobalContext = createContext({} as IGlobalContext);
export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalContextProvider  = ({children}: {children: ReactNode})  => {
    const [provider, setProvider] = useState<ethers.providers.Web3Provider>()
    const [contract, setContract] = useState<ethers.ContractInterface>()
    const [account, setAccount] = useState('0x0')
    const [chainId, setChainId] = useState<string>()
    const [step, setStep] = useState(0)

    // setup params
    async function resetParams() {
        const params = await GetParams();
        setStep(params.step);
        setChainId(params.chainId);
        setAccount(params.account);
    }

    useEffect(() => {
        resetParams();
        window?.ethereum?.on('chainChanged', () => {
            resetParams();
        });
        window?.ethereum?.on('accountsChanged', () => {
            resetParams();
        });
    }, []);

    // setup contract and provider
    function setupContract() {
        if (!contract) {
            return
        }

        const newProvider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = newProvider?.getSigner();
        const newContract = new ethers.Contract(ADDRESSES[chainId as unknown as SupportedChainIds], contract, signer);

        setProvider(newProvider);
        setContract(newContract[0]);
    }

    useEffect(() => {
        if(step === -1) {
            setupContract()
        }
    }, [step])

    return (
        <GlobalContext.Provider value={{
            provider,
            contract,
            account,
            chainId,
        }}>
            {children}
        </GlobalContext.Provider>
    )
}