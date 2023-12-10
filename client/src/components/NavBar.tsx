import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import {useGlobalContext} from "../contextProviders/GlobalContextProvider";
import {useEffect, useState} from "react";
import {getMetaMaskConnectionStatus} from "../pages/MetaMaskConnector";
export const NavBar = () => {
    const {step: currentMetamaskStep} = useGlobalContext();
    const [isMetamaskConnected, setIsMetamaskConnected] = useState<boolean>(false);

    useEffect(() => {
        setIsMetamaskConnected(getMetaMaskConnectionStatus(currentMetamaskStep).isConnected);
    }, [currentMetamaskStep]);

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" sx={{backgroundColor:"#75b3ef"}}>
                <Toolbar>
                    {/* <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton> */}
                    <img src={require('../assets/logo.png')} style={{height: "50px", marginTop:"5px"}}/>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color:"black", fontWeight: "600"}}>
                        ArCred
                    </Typography>
                    {isMetamaskConnected ?
                        <Button disableRipple color="success" variant="contained">Connected to MetaMask</Button>
                        :
                        <Button disableRipple color="error" variant="contained">Not connected to MetaMask</Button>}
                </Toolbar>
            </AppBar>
        </Box>
    );
}
