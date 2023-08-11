import {RecoilRoot} from "recoil";
import {CharacterCounter} from "./components/tutorial/CharacterCounter";
import {TodoList} from "./components/todolist/TodoList";

const App = () => {
    return (
        <RecoilRoot>
            <CharacterCounter/>
            <TodoList/>
        </RecoilRoot>
    );
}

export default App;
