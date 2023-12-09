import './App.css';
import {UIState, useGlobalContext} from "./contextProviders/GlobalContextProvider";
import {CircularProgress} from "@mui/material";
import {NetworkSelector, supportedNetworksConfig} from "./pages/NetworkSelector";
import {getMetaMaskConnectionStatus, MetaMaskConnector} from "./pages/MetaMaskConnector";
import {useEffect} from "react";
import {Dashboard} from "./pages/Dashboard";
import chainConfig from "./onboarding/config.json";

function App() {
    const globalContext = useGlobalContext();
    const {uiState, step: currentMetamaskStep} = globalContext;

    useEffect(() => {
        const connectionStatus = getMetaMaskConnectionStatus(currentMetamaskStep);
        if(connectionStatus.isConnected){
            if(supportedNetworksConfig.filter(config => config.chainId == globalContext.chainId).length){
                globalContext.setUIState(UIState.DISPLAY_DASHBOARD)

            } else {
                globalContext.setUIState(UIState.REQUEST_NETWORK_SELECTION)
            }
        }else {
            globalContext.setUIState(UIState.REQUEST_METAMASK_CONNECTION)
        }
    }, [currentMetamaskStep]);

    return getUIContentByUIState(uiState);
}

const getUIContentByUIState = (uiState: UIState) => {
    switch (uiState) {
        case UIState.REQUEST_METAMASK_CONNECTION:
            return <MetaMaskConnector />;
        case UIState.REQUEST_NETWORK_SELECTION:
            return <NetworkSelector />;
        case UIState.DISPLAY_DASHBOARD:
            return <Dashboard />;
        case UIState.LOADING:
        default:
            return <CircularProgress />
    }
}

export default App;
