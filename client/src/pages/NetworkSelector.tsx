import {Layout} from "../components/Layout";
import {Avatar, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import Button from "@mui/material/Button";
import FolderIcon from '@mui/icons-material/Folder';
import Typography from "@mui/material/Typography";
import Grid2 from "@mui/material/Unstable_Grid2";
import chainConfig from "../onboarding/config.json";
import {switchNetwork} from "../onboarding/onboard";
import {UIState, useGlobalContext} from "../contextProviders/GlobalContextProvider";
import {useEffect, useState} from "react";

interface INetworkSelectorProps {}

interface INetworksConfig {
    "chainId": string,
    "chainName": string,
    "symbol": string,
    "decimals": number,
    "rpcUrls": string[],
    "blockExplorerUrls": string[],
    "minimumWalletBalance": number
}

const supportedNetworksConfig: INetworksConfig[] = chainConfig;

export const NetworkSelector = (props: INetworkSelectorProps) => {
    return <Layout>
        <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
            List of supported networks
        </Typography>
        <Grid2 xs display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
            <NetworkDetailsList networksConfig={supportedNetworksConfig}/>
        </Grid2>
    </Layout>
}

const NetworkDetailsList = ({networksConfig}: {networksConfig: INetworksConfig[]}) => {
    return <>
        {networksConfig.map((config, i) => <NetworkDetailsItem {...config} key={i}/>)}
    </>
}

const NetworkDetailsItem = (networkConfig: INetworksConfig) => {
    const {chainId, setUIState} = useGlobalContext();
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        setIsConnected(chainId == networkConfig.chainId);
    }, [chainId]);

    const networkSwitchHandler = async () => {
        await switchNetwork(networkConfig.chainId)
        console.log("switchind")
        setUIState(UIState.DISPLAY_DASHBOARD);
    }

    return <ListItem
        secondaryAction={
            isConnected ?
                <Button variant="contained" color="success" onClick={() => {}}>Connected</Button>
                :
                <Button variant="outlined" color="info" onClick={networkSwitchHandler}>Switch</Button>
        }
    >
        <ListItemAvatar>
            <Avatar>
                <FolderIcon />
            </Avatar>
        </ListItemAvatar>
        <ListItemText primary={networkConfig.chainName} />
    </ListItem>
}