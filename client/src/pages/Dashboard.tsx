import {useState} from "react";
import {Layout} from "../components/Layout";
import Grid2 from "@mui/material/Unstable_Grid2";
import {FormControl, InputLabel, MenuItem, Select, SelectChangeEvent} from "@mui/material";
import Typography from "@mui/material/Typography";
import {useGlobalContext} from "../contextProviders/GlobalContextProvider";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {BorrowerDashboard} from "../components/BorrowerDashboard";
import { AdminDashboard } from "../components/AdminDashboard";

export enum UserType{
    BORROWER = "BORROWER",
    LENDER = "LENDER",
    ADMIN = "ADMIN",
}

export const Dashboard = () => {
    const {account} = useGlobalContext();
    const [viewAs, setViewAs] = useState<UserType>(UserType.BORROWER);

    const viewAsChangeHandler = (event: SelectChangeEvent) => {
        setViewAs(event.target.value as UserType);
    }

    return <Layout>
        <Grid2 container justifyContent={"space-between"} alignItems={"baseline"} border={1}>
                <FormControl>
                    <InputLabel id="demo-simple-select"> View as</InputLabel>
                    <Select
                        labelId="view-as-label"
                        id="demo-simple-select"
                        value={viewAs}
                        label="View As"
                        onChange={viewAsChangeHandler}
                        color={"primary"}
                    >
                        <MenuItem value={UserType.BORROWER}>Borrower</MenuItem>
                        <MenuItem value={UserType.LENDER}>Lender</MenuItem>
                        <MenuItem value={UserType.ADMIN}>Admin</MenuItem>
                    </Select>
                </FormControl>
                <Typography><b>Account: </b> {account}</Typography>
        </Grid2>
        {getDataByUserType(viewAs)}
    </Layout>

    // let content;
    // switch (viewAs){
    //     case UserType.LENDER:
    //         break;
    //     case UserType.ADMIN:
    //         break;
    //     case UserType.BORROWER:
    //     default:
    //         break;
    // }
}

// const getDataTable = () => {
//     const columns: GridColDef[] = [
//         { field: 'id', headerName: 'ID', width: 70 },
//         { field: 'firstName', headerName: 'First name', width: 130 },
//         { field: 'lastName', headerName: 'Last name', width: 130 },
//         {
//             field: 'age',
//             headerName: 'Age',
//             type: 'number',
//             width: 90,
//         }
//     ]
//
//     const rows = [
//         { id: 1, lastName: 'Snow', firstName: 'Jon', age: 35 },
//         { id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 42 },
//         { id: 3, lastName: 'Lannister', firstName: 'Jaime', age: 45 },
//         { id: 4, lastName: 'Stark', firstName: 'Arya', age: 16 }
//     ]
//
//
//     return <DataGrid
//         rows={rows}
//         columns={columns}
//         initialState={{
//             pagination: {
//                 paginationModel: { page: 0, pageSize: 5 },
//             },
//         }}
//         pageSizeOptions={[5, 10]}
//         // checkboxSelection
//     />
// }

const getDataByUserType = (viewType: UserType) => {
    switch (viewType){
        case UserType.LENDER:
            return <BorrowerDashboard />
        case UserType.ADMIN:
            return <AdminDashboard />
        case UserType.BORROWER:
        default:
            return <BorrowerDashboard />
    }
}