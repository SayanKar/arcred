import './App.css';
import {UIState, useGlobalContext} from "./contextProviders/GlobalContextProvider";
import {CircularProgress} from "@mui/material";
import {NetworkSelector} from "./pages/NetworkSelector";
import {getMetaMaskConnectionStatus, MetaMaskConnector} from "./pages/MetaMaskConnector";
import {useEffect} from "react";

function App() {
    const globalContext = useGlobalContext();
    const {uiState, step: currentMetamaskStep} = globalContext;

    useEffect(() => {
        console.log({globalContext})
        const connectionStatus = getMetaMaskConnectionStatus(currentMetamaskStep);
        if(connectionStatus.isConnected){
            globalContext.setUIState(UIState.REQUEST_NETWORK_SELECTION)
        }else {
            globalContext.setUIState(UIState.REQUEST_METAMASK_CONNECTION)
        }
    }, [currentMetamaskStep]);

    return getUIContentByUIState(uiState);
}

const getUIContentByUIState = (uiState: UIState) => {
    switch (uiState) {
        case UIState.LOADING:
            return <CircularProgress />
        case UIState.REQUEST_METAMASK_CONNECTION:
            return <MetaMaskConnector />;
        case UIState.REQUEST_NETWORK_SELECTION:
            return <NetworkSelector />;
        case UIState.DISPLAY_DASHBOARD:
            return <></>;
        default:
            return <></>;
    }
}

export default App;
