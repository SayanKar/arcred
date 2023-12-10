import { Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useApiContext } from "../contextProviders/APIContextProvider";

export default function RegisterBorrowerActivity() {
    const [loanId, setLoanId] = useState(0);
    const [unsettledAmount, setUnsettledAmount] = useState(0);
    const [defaultAmount, setDefaultAmount] = useState(0);
    const [registering, setRegistering] = useState(false);
    const handleLoanIdChange = (e: any) => {
        setLoanId(e.target.value);
    }

    const handleUnsettledAmountChange = (e: any) => {
        setUnsettledAmount(e.target.value);
    }

    const handleDefaultAmountChange = (e: any) => {
        setDefaultAmount(e.target.value);
    }

    const {reportBorrowerActivity} = useApiContext();

    const handleSubmit = async () => {
        if(registering) return;
        setRegistering(true);
        alert("Report borrower activity: Submitting transaction");
        await reportBorrowerActivity(loanId, unsettledAmount, defaultAmount, 0);
        alert("Report borrower activity: Transaction Successfull");
        setDefaultAmount(0);
        setLoanId(0);
        setUnsettledAmount(0);
        setRegistering(false);
    }
    return (
        <Box sx={{marginTop: "10px"}}>
            <Typography variant="h6" sx={{ marginBottom: "30px" }}>Report borrower activity</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", width: "600px"}}>
                <TextField
                    id="outlined-loanId-input"
                    label="Loan Id"
                    type="text"
                    value={loanId}
                    onChange={handleLoanIdChange}
                    sx={{ width: "250px", marginBottom: "30px", marginRight: "30px"}}
                />
                <TextField
                    id="outlined-unsettledAmount-input"
                    label="Unsettled Amount"
                    type="text"
                    value={unsettledAmount}
                    onChange={handleUnsettledAmountChange}
                    sx={{ width: "250px", marginBottom: "30px" }}
                />
                <TextField
                    id="outlined-defaultAmount-input"
                    label="Default Amount"
                    type="text"
                    value={defaultAmount}
                    onChange={handleDefaultAmountChange}
                    sx={{ width: "250px", marginBottom: "30px" }}
                />
            </Box>
            <Button variant="outlined" color="success" onClick={handleSubmit}>{registering ? "Reporting" : "Report activity"}</Button>
        </Box>
    );
}