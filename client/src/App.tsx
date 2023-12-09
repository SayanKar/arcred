import './App.css';
import {useUserContext} from "./contextProviders/UserContextProvider";

function App() {
    const userContext = useUserContext();
    console.log(userContext)
    return (
    <div>
        {userContext.walletAddress}
    </div>
    );
}

export default App;
