import {useRecoilState} from "recoil";

export const TodoListFilters = ({todoListFilterState}) => {
    const [filter, setFilter] = useRecoilState(todoListFilterState);

    const updateFilter = ({target: {value}}) => {
        setFilter(value);
    };

    return (
        <>
            Filter:
            <select value={filter} onChange={updateFilter}>
                <option value={"Show ALL"}>All</option>
                <option value={"Show Completed"}>Completed</option>
                <option value={"Show Uncompleted"}>Uncompleted</option>
            </select>
        </>
    );
}