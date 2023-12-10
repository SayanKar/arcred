import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Grid2 from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import TableHead from "@mui/material/TableHead";
import {TextField} from "@mui/material";
import Button from "@mui/material/Button";
import * as React from "react";
import {useEffect, useState} from "react";
import {BorrowerStats, LoanData, useApiContext} from "../contextProviders/APIContextProvider";
import {useGlobalContext} from "../contextProviders/GlobalContextProvider";


export const BorrowerDashboard = () => {
    const sampleData = [
        {attrName: "Credit Score", val: "12"},
        {attrName: "Number of defaults", val: "12"},
        {attrName: "Number of credit line loans", val: "12"},
        {attrName: "Number of consumer loans", val: "12"},
    ]
    const sampleLoanData = [
        {loanId: "ad",
            type: "faf",
            desc: "HJH hjfa",
            creationTime: "46176748",
            sanctionedAmount: "4154362",
            lender: "Sameer",
            borrower: "Raj",
            isActive: "Yes",
            unsettledAmount: "41515",
            defaultAmount: "13553",
            lastUpdated: "515115"},
        {loanId: "ad",
            type: "faf",
            desc: "HJH hjfa",
            creationTime: "46176748",
            sanctionedAmount: "4154362",
            lender: "Sameer",
            borrower: "Raj",
            isActive: "Yes",
            unsettledAmount: "41515",
            defaultAmount: "13553",
            lastUpdated: "515115"},
        {loanId: "ad",
            type: "faf",
            desc: "HJH hjfa",
            creationTime: "46176748",
            sanctionedAmount: "4154362",
            lender: "Sameer",
            borrower: "Raj",
            isActive: "Yes",
            unsettledAmount: "41515",
            defaultAmount: "13553",
            lastUpdated: "515115"}
    ]

    const {getMyCreditReport, approveLender} = useApiContext();

    const [lenderAddress, setLenderAddress] = useState<string>('');
    const [creditReport, setCreditReport] = useState<BorrowerStats>({} as BorrowerStats);
    const [loanData, setLoanData] = useState<LoanData[]>([]);

    useEffect(() => {
        //fetch credit report
        getMyCreditReport().then(res => {
            if(res.isError){
                alert(res.message);
            }
            setCreditReport(res.item!.borrowerStats!);
            setLoanData(res.item!.loanData!);
        })

        //fetch loan report

    }, []);

    const handleLenderAllowlist = async () => {
        if (lenderAddress) {
            const res = await approveLender(lenderAddress, true)
            if (!res.isError) {
                alert('Successfull!')
            } else {
                alert(res.message)
            }
        }
    }

    return <>
        <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div" marginTop={2}>
            Your credit report
        </Typography>
        <Grid2 xs sx={{width: '700px'}} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
            {
                getDataTable([
                    {
                        attrName: 'Credit Score',
                        val: creditReport.creditScore?.toString(),
                    },
                    {
                        attrName: 'Number of Defaults',
                        val: creditReport.numberOfDefaults?.toString(),
                    },
                    {
                        attrName: 'Number of Consumer Loans',
                        val: creditReport?.numberOfConsumerLoans?.toString(),
                    },
                    {
                        attrName: 'Number of Credit Lines',
                        val: creditReport?.numberOfCreditLines?.toString(),
                    }
                ])
            }


        </Grid2>

        <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div" marginTop={2}>
            Your loan history
        </Typography>
        <Grid2 xs display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
            {getLoanTable(loanData)}
        </Grid2>


        <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div" marginTop={2}>
            Whitelist a lender to view your credit score
        </Typography>

        <Grid2 xs >
            <TextField sx={{ width: '500px' }} id="lender's account id" label="Lender's Account Id" variant="outlined" onChange={(e) => {setLenderAddress(e.target.value)}}/>
            <br/><br/>
            <Button color="success" variant="outlined" onClick={handleLenderAllowlist}>Allow</Button>
        </Grid2>
    </>
}

const getDataTable = (data: {attrName: string, val: string}[]) => {

    return <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableBody>
                {data.map((d, i) => <TableRow
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                    <TableCell component="th" scope="row">{d.attrName}</TableCell>
                    <TableCell align="right">{d.val}</TableCell>
                </TableRow>)}
            </TableBody>
        </Table>
    </TableContainer>
}

const getLoanTable = (loanData: any) => {

    return <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
                <TableRow>
                    <TableCell>LoanID</TableCell>
                    <TableCell align="right">Type</TableCell>
                    <TableCell align="right">Description</TableCell>
                    <TableCell align="right">CreationTime</TableCell>
                    <TableCell align="right">SanctionedAmount</TableCell>
                    <TableCell align="right">Lender</TableCell>
                    <TableCell align="right">Borrower</TableCell>
                    <TableCell align="right">IsActive</TableCell>
                    <TableCell align="right">Unsettled Amount</TableCell>
                    <TableCell align="right">Default Amount</TableCell>
                    <TableCell align="right">Last updated</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {loanData.map((d: any, i: number) => <TableRow
                    key={i}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                    <TableCell>{d.loanId}</TableCell>
                    <TableCell align="right">{d.type}</TableCell>
                    <TableCell align="right">{d.desc}</TableCell>
                    <TableCell align="right">{d.creationTime}</TableCell>
                    <TableCell align="right">{d.sanctionedAmount}</TableCell>
                    <TableCell align="right">{d.lender}</TableCell>
                    <TableCell align="right">{d.borrower}</TableCell>
                    <TableCell align="right">{d.isActive.toString()}</TableCell>
                    <TableCell align="right">{d.unsettledAmount}</TableCell>
                    <TableCell align="right">{d.defaultAmount}</TableCell>
                    <TableCell align="right">{d.lastUpdated}</TableCell>
                </TableRow>)}
            </TableBody>
        </Table>
    </TableContainer>
}