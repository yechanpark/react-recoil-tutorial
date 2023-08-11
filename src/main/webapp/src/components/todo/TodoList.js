import {atom, useRecoilValue} from "recoil";
import {TodoItemCreator} from "./TodoItemCreator";
import {TodoItem} from "./TodoItem";

export const TodoList = () => {
    const todoListState = atom({
        key: 'todoListState',
        default: []
    });

    const todoList = useRecoilValue(todoListState);

    return (
        <>
            {/* <TodoListStats /> */}
            {/* <TodoListFilters /> */}
            <TodoItemCreator todoListState={todoListState}/>

            {todoList.map((todoItem) => (
                <TodoItem key={todoItem.id} item={todoItem} todoListState={todoListState}/>
            ))}
        </>
    );
}

