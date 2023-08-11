import {RecoilRoot} from "recoil";
import {CharacterCounter} from "./components/CharacterCounter";

const App = () => {
    return (
        <RecoilRoot>
            <CharacterCounter/>
        </RecoilRoot>
    );
}

export default App;
