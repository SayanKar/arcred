import './App.css';
import { useGlobalContext } from "./contextProviders/GlobalContextProvider";

function App() {
    const globalContext = useGlobalContext();

    return (
      <div>
        {globalContext.account}
        {globalContext.chainId}
      </div>
    );
}

export default App;
