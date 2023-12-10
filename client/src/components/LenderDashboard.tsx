
import Grid2 from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import {FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField} from "@mui/material";
import Button from "@mui/material/Button";
import * as React from "react";
import {useEffect, useState} from "react";
import {BorrowerStats, LoanData, useApiContext} from "../contextProviders/APIContextProvider";
import {useGlobalContext} from "../contextProviders/GlobalContextProvider";


export const LenderDashboard = () => {

    const {account} = useGlobalContext();
    const {registerLoan} = useApiContext();

    const [lendingFormData, setLendingFormData] = useState({});

    useEffect(() => {

    }, []);

    const lendingFormDataTmp = {loanType: 0, description: '', amount: 0, borrowerAddress: ''}

    const handleLendingRegistration = () => {
        setLendingFormData(lendingFormDataTmp);
    }

    return <>
        <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div" marginTop={2}>
            Register a lending
        </Typography>
        <Grid2 xs display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
            <FormControl>
                <FormLabel id="loan-type-radio-buttons-group-label">Loan Type</FormLabel>
                <RadioGroup
                    aria-labelledby="loan-type-radio-buttons-group-label"
                    defaultValue={0}
                    name="loan-type-radio-buttons-group"
                    sx={{display: "flex", flexDirection: "row"}}
                    onChange={(e)=>{lendingFormDataTmp.loanType = parseInt(e.target.value)}}
                >
                    <FormControlLabel value={0} control={<Radio />} label="Credit Line" />
                    <FormControlLabel value={1} control={<Radio />} label="Consumer Loan" />
                </RadioGroup>
            </FormControl>
            <TextField id="outlined-basic" label="Description" variant="outlined" onChange={(e) => {lendingFormDataTmp.description = e.target.value}}/>
            <TextField id="outlined-basic" label="Amount" variant="outlined" onChange={(e) => {lendingFormDataTmp.amount = parseInt(e.target.value)}}/>
            <TextField id="outlined-basic" label="Borrower's Account" variant="outlined" onChange={(e) => {lendingFormDataTmp.borrowerAddress = e.target.value}}/>
            <Button color="success" variant="outlined" onClick={handleLendingRegistration}>Register the lending</Button>
        </Grid2>

        <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div" marginTop={2}>
            Your loan history
        </Typography>
        <Grid2 xs display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
        </Grid2>
    </>
}