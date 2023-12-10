import { Box, Button, TextField, Typography } from "@mui/material"
import { useState } from "react";
import { useApiContext } from "../contextProviders/APIContextProvider";

export const AdminDashboard = () => {
    const [lenderAddress, setLenderAddress] = useState("");
    const [prevSubmitInProgress, setPrevSubmitInProgress] = useState(false);
    const {registerLender} = useApiContext();
    const handleChange = (e: any) => {
        setLenderAddress(e.target.value);
    }

    const handleSubmit = async () => {
        // if(prevSubmitInProgress) return;
        console.log("InSubmit");
        setPrevSubmitInProgress(true);
        alert("Register Lender: Submitting transaction");
        const res = await registerLender(lenderAddress);
        res.isError ? alert(res.message) : alert("Register Lender: Transaction Success");
        setLenderAddress("");
        setPrevSubmitInProgress(false);
    }

    return (
        <Box sx={{display:"flex", justifyContent: "center", alignItems: "center"}}>
            <Box sx={{height: "500px", width: "700px", marginTop: "300px"}}>
            <Box sx={{display:"flex", justifyContent: "center", alignItems: "center"}}>
            <TextField
                id="outlined-address-input"
                label="Lender Address"
                type="text"
                sx={{width: "400px", marginRight: "30px"}}
                value={lenderAddress}
                onChange={handleChange}
            />
            <Button variant="contained" onClick={handleSubmit}>{!prevSubmitInProgress ? "Register Lender": "Registering Lender"}</Button>
            </Box>
            </Box>
        </Box>
    )
}
