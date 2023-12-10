import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Grid2 from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import TableHead from "@mui/material/TableHead";
import { Box, TextField } from "@mui/material";
import Button from "@mui/material/Button";
import * as React from "react";
import { useEffect, useState } from "react";
import { BorrowerStats, LoanData, useApiContext } from "../contextProviders/APIContextProvider";
import { useGlobalContext } from "../contextProviders/GlobalContextProvider";


export const BorrowerDashboard = () => {
    const {contract} = useGlobalContext();
    const {getMyCreditReport, approveLender} = useApiContext();

    const [lenderAddress, setLenderAddress] = useState<string>('');
    const [creditReport, setCreditReport] = useState<BorrowerStats>({} as BorrowerStats);
    const [loanData, setLoanData] = useState<LoanData[]>([]);

    useEffect(() => {
        if (contract) {
            //fetch credit report
            getMyCreditReport().then(res => {
                if(res.isError){
                    alert(res.message);
                    return
                }
                setCreditReport(res.item!.borrowerStats!);
                setLoanData(res.item!.loanData!);
            })
        }
    }, [contract]);

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
        <Box sx={{display:"flex", justifyContent: "space-between", flexWrap:"wrap"}}>
            <Box>
                <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div" marginTop={2}>
                    Your credit report
                </Typography>
                <Grid2 xs sx={{ width: '700px' }} display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
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
            </Box>
            <Box sx={{marginRight: "50px"}}>
                <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div" marginTop={2}>
                Approve lender to view your credit score and report your loans
                </Typography>

                <Grid2 xs >
                    <TextField sx={{ width: '500px' }} id="lender's account id" label="Lender Address" variant="outlined" onChange={(e) => { setLenderAddress(e.target.value) }} />
                    <br /><br />
                    <Button color="success" variant="outlined" onClick={handleLenderAllowlist}>Allow</Button>
                </Grid2></Box>
        </Box>
        <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div" marginTop={2}>
            Your loan history
        </Typography>
        <Grid2 xs display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
            {getLoanTable(loanData)}
        </Grid2>
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

const getLoanTable = (loanData: any) => {

    return <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
                <TableRow>
                    <TableCell sx={{ fontWeight: "600" }}>LoanID</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "600" }}>Type</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "600" }}>Description</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "600" }}>CreationTime</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "600" }}>SanctionedAmount</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "600" }}>Lender</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "600" }}>Borrower</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "600" }}>IsActive</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "600" }}>Unsettled Amount</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "600" }}>Default Amount</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "600" }}>Last updated</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {loanData.length === 0 ?
                    <TableRow>
                        <Box sx={{ width: "100%", height: "50px", display: "flex", justifyContent: "center", alignItems: "center" }}>No data to show</Box>
                    </TableRow> :
                    loanData.map((d: any, i: number) => <TableRow
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