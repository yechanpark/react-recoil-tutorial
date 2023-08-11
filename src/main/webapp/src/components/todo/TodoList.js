import {atom, selector, useRecoilValue} from "recoil";
import {TodoItemCreator} from "./TodoItemCreator";
import {TodoItem} from "./TodoItem";
import {TodoListFilters} from "./TodoListFilters";
import {TodoListStats} from "./TodoListStats";

export const TodoList = () => {
    const todoListState = atom({
        key: 'todoListState',
        default: []
    });

    const todoListFilterState = atom({
        key: 'todoListFilterState',
        default: 'Show All'
    });

    const filteredTodoListState = selector({
        key: 'filteredTodoListState',
        get: ({get}) => {
            const filter = get(todoListFilterState);
            const list = get(todoListState);

            switch (filter) {
                case 'Show Completed':
                    return list.filter((item) => item.isComplete);
                case 'Show Uncompleted':
                    return list.filter((item) => !item.isComplete);
                default:
                    return list;
            }
        }
    });

    const todoList = useRecoilValue(filteredTodoListState);

    const todoListStatsState = selector({
        key: 'todoListStatsState',
        get: ({get}) => {
            const todoList = get(todoListState);
            const totalNum = todoList.length;
            const totalCompletedNum = todoList.filter((item) => item.isComplete).length;
            const totalUncompletedNum = totalNum - totalCompletedNum;
            const percentCompleted = totalNum === 0 ? 0 : totalCompletedNum / totalNum;

            return {
                totalNum,
                totalCompletedNum,
                totalUncompletedNum,
                percentCompleted
            };
        }
    });

    return (
        <>
            <TodoListStats todoListStatsState={todoListStatsState} />
            <TodoListFilters todoListFilterState={todoListFilterState} />
            <TodoItemCreator todoListState={todoListState}/>

            {todoList.map((todoItem) => (
                <TodoItem key={todoItem.id} item={todoItem} todoListState={todoListState}/>
            ))}
        </>
    );
}

