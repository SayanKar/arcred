import React, {createContext, ReactNode, useContext, useState} from 'react';

type networkType = null | "a" | "b";

interface IUserContext {
    selectedNetwork: networkType,
    walletAddress: String,
    setSelectedNetwork: (updatedNetworkType: networkType) => void,
    setWalletAddress: (updatedWalletAddress: string) => void,
}

const defaultUserContext: IUserContext = {
    selectedNetwork: null,
    walletAddress: '',
    setSelectedNetwork: () => {},
    setWalletAddress: () => {},
}

const UserContext = createContext(defaultUserContext);

export const useUserContext = () => useContext(UserContext);

export const UserContextProvider  = ({children}: {children: ReactNode})  => {
    const [selectedNetwork, setSelectedNetwork]= useState<networkType>(null);
    const [walletAddress, setWalletAddress]= useState<String>('');
    return <UserContext.Provider value={{selectedNetwork, setSelectedNetwork, walletAddress, setWalletAddress}}>
        {children}
    </UserContext.Provider>
}