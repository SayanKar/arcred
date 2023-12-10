
import Grid2 from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import {Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField} from "@mui/material";
import Button from "@mui/material/Button";
import * as React from "react";
import {useRef, useState} from "react";
import {BorrowerStats, useApiContext} from "../contextProviders/APIContextProvider";
import {useGlobalContext} from "../contextProviders/GlobalContextProvider";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";


export const LenderDashboard = () => {

    const {account} = useGlobalContext();
    const {registerLoan, getBorrowerCreditReport} = useApiContext();

    const lendingFormData = useRef({loanType: 0, description: '', amount: 0, borrowerAddress: ''})
    const [borrowerAddress, setBorrowerAddress] = useState('');
    const [borrowerCreditReport, setBorrowerCreditReport] = useState<BorrowerStats>({} as BorrowerStats)

    const handleLendingRegistration = () => {
        console.log(lendingFormData.current)
        registerLoan(lendingFormData.current.loanType, lendingFormData.current.description,
            lendingFormData.current.amount, lendingFormData.current.borrowerAddress).then(res => {
                if(res.isError){
                    alert(res.message);
                }
        })
    }

    const fetchBorrowerCreditReport = () => {
        getBorrowerCreditReport(borrowerAddress).then(res => {
            if(res.isError){
                alert(res.message);
            }
            setBorrowerCreditReport(res.item!);
        })
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
                    onChange={(e)=>{lendingFormData.current.loanType = parseInt(e.target.value)}}
                >
                    <FormControlLabel value={0} control={<Radio />} label="Credit Line" />
                    <FormControlLabel value={1} control={<Radio />} label="Consumer Loan" />
                </RadioGroup>
            </FormControl>
            <TextField id="outlined-basic" label="Description" variant="outlined" onChange={(e) => {lendingFormData.current.description = e.target.value}}/>
            <TextField id="outlined-basic" label="Amount" variant="outlined" onChange={(e) => {lendingFormData.current.amount = parseInt(e.target.value)}}/>
            <TextField id="outlined-basic" label="Borrower's Account" variant="outlined" onChange={(e) => {lendingFormData.current.borrowerAddress = e.target.value}}/>
            <Button color="success" variant="outlined" onClick={handleLendingRegistration}>Register the lending</Button>
        </Grid2>

        <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div" marginTop={2}>
            Your loan history
        </Typography>
        <Grid2 xs display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
        </Grid2>


        <Box sx={{marginRight: "50px"}}>
            <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div" marginTop={2}>
                Get borrower's credit report
            </Typography>

            <Grid2 xs >
                <TextField sx={{ width: '500px' }} id="borrower's account id" label="Borrower Address" variant="outlined" onChange={(e) => { setBorrowerAddress(e.target.value) }} />
                <br /><br />
                <Button color="success" variant="outlined" onClick={fetchBorrowerCreditReport}>Fetch credit report</Button>
            </Grid2>
        </Box>

        {(borrowerCreditReport?.creditScore && borrowerCreditReport?.creditScore !== 0) && <Grid2 xs sx={{width: '700px'}} display="flex" justifyContent="center" alignItems="center"
                flexDirection={"column"}>
            {
                getDataTable([
                    {
                        attrName: 'Credit Score',
                        val: borrowerCreditReport.creditScore?.toString(),
                    },
                    {
                        attrName: 'Number of Defaults',
                        val: borrowerCreditReport.numberOfDefaults?.toString(),
                    },
                    {
                        attrName: 'Number of Consumer Loans',
                        val: borrowerCreditReport?.numberOfConsumerLoans?.toString(),
                    },
                    {
                        attrName: 'Number of Credit Lines',
                        val: borrowerCreditReport?.numberOfCreditLines?.toString(),
                    }
                ])
            }
        </Grid2>}
    </>
}

const getDataTable = (data: { attrName: string, val: string }[]) => {

    return <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableBody>
                {data.map((d, i) => <TableRow
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                    <TableCell component="th" scope="row">{d.attrName}</TableCell>
                    <TableCell align="right">{d.val}</TableCell>
                </TableRow>)
                }
            </TableBody>
        </Table>
    </TableContainer>
}