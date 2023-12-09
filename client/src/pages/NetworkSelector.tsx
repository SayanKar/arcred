import {Layout} from "../components/Layout";
import {Avatar, List, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import Button from "@mui/material/Button";
import FolderIcon from '@mui/icons-material/Folder';
import Typography from "@mui/material/Typography";
import Grid2 from "@mui/material/Unstable_Grid2";

interface INetworkSelectorProps {}

const supportedNetworksConfig = [
    {name: "A", logo: "a"},
    {name: "B", logo: "b"},
    {name: "C", logo: "c"},
]

export const NetworkSelector = (props: INetworkSelectorProps) => {
    return <Layout>
        <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
            List of supported networks
        </Typography>
        <Grid2 xs display="flex" justifyContent="center" alignItems="center" flexDirection={"column"}>
                <ListItem
                    secondaryAction={
                        <Button variant="outlined">Connect</Button>
                    }

                >
                    <ListItemAvatar>
                        <Avatar>
                            <FolderIcon />
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary="Sample" />
                </ListItem>
                <ListItem
                    secondaryAction={
                        <Button variant="outlined">Outlined</Button>
                    }
                >
                    <ListItemAvatar>
                        <Avatar>
                            <FolderIcon />
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary="Sample" />
                </ListItem>,
            {/*</List>*/}
        </Grid2>
    </Layout>
}