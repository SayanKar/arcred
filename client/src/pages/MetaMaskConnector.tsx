import {Layout} from "../components/Layout";
import Grid2 from "@mui/material/Unstable_Grid2";
import * as React from "react";
import {useEffect, useState} from "react";
import Button from "@mui/material/Button";
import {useGlobalContext} from "../contextProviders/GlobalContextProvider";
import Typography from "@mui/material/Typography";
import {GetParams} from "../onboarding/onboard";

interface IMetaMaskConnectorProps {}

export const MetaMaskConnector = (props: IMetaMaskConnectorProps) => {
    const globalContext = useGlobalContext();
    const {step: currentMetamaskStep} = globalContext;

    const [metamaskConnectionStatus, setMetamaskConnectionStatus]
        = useState<{isConnected: boolean, msg: String}>({isConnected: false, msg: ''});

    useEffect(() => {
        setMetamaskConnectionStatus(getMetaMaskConnectionStatus(currentMetamaskStep));
    }, [currentMetamaskStep]);


    const metamaskConnectionHandler = () => {
        console.log("Calling metamask")
        GetParams();
    }

    return <Layout>
        <Grid2 xs display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
            <Button color="inherit" variant="outlined" onClick={metamaskConnectionHandler}>Connect with MetaMask</Button>
            {metamaskConnectionStatus.msg && <Typography color={"red"}>{metamaskConnectionStatus.msg}</Typography>}
        </Grid2>
    </Layout>
};

export const getMetaMaskConnectionStatus = (step: number) => {
    const connectionStatus = {isConnected: false, msg: ''};
    switch (step) {
        case 0:
            connectionStatus.msg = "Please install Metamask";
            break;
        case 1:
            connectionStatus.msg = "Connect any account in Metamask with this page or check if request is already pending";
            break;
        case 2:
            connectionStatus.isConnected = true;
            connectionStatus.msg = "Please switch to supported network";
            break;
        default:
            connectionStatus.isConnected = true;
            connectionStatus.msg = "Connected to metamask"
    }
    return connectionStatus;
}