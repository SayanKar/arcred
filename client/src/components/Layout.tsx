import {ReactNode} from "react";
import Grid2 from "@mui/material/Unstable_Grid2";
import {NavBar} from "./NavBar";


export const Layout = ({children}: {children: ReactNode}) => {

    return <>
        <NavBar />
        <Grid2 container spacing={2} direction={"column"} margin={2} padding={3}>
            {children}
        </Grid2>
    </>
}