import './App.css';
import {Layout} from "./components/Layout";
import {useState} from "react";
import {CircularProgress} from "@mui/material";
import {NetworkSelector} from "./pages/NetworkSelector";

enum UIState {
    LOADING,
    REQUEST_NETWORK_SELECTION,
    DISPLAY_DASHBOARD
}

function App() {

    const [uiState, setUIState] = useState<UIState>(UIState.REQUEST_NETWORK_SELECTION);



    return getUIContentByUIState(uiState);
}

const getUIContentByUIState = (uiState: UIState) => {
    switch (uiState) {
        case UIState.LOADING:
            return <CircularProgress />
        case UIState.REQUEST_NETWORK_SELECTION:
            return <NetworkSelector />;
        case UIState.DISPLAY_DASHBOARD:
            return <></>;
        default:
            return <></>;
    }
}

export default App;
