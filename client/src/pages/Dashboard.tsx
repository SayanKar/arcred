import {useState} from "react";
import {Layout} from "../components/Layout";
import Grid2 from "@mui/material/Unstable_Grid2";
import {MenuItem, Select, SelectChangeEvent} from "@mui/material";
import Typography from "@mui/material/Typography";
import {useGlobalContext} from "../contextProviders/GlobalContextProvider";
import {BorrowerDashboard} from "../components/BorrowerDashboard";
import {LenderDashboard} from "../components/LenderDashboard";

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
                <Typography><b>Account: </b> {account}</Typography>
        </Grid2>
        {getDataByUserType(viewAs)}
    </Layout>
}

const getDataByUserType = (viewType: UserType) => {
    switch (viewType){
        case UserType.LENDER:
            return <LenderDashboard />
        case UserType.ADMIN:
            return <BorrowerDashboard />
        case UserType.BORROWER:
        default:
            return <BorrowerDashboard />
    }
}