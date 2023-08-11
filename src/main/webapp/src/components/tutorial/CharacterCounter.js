import {atom, selector, useRecoilState, useRecoilValue} from "recoil";

export const CharacterCounter = () => {

    const textState = atom({
        key: 'textState', // unique ID
        default: '' // default value
    });

    const charCountState = selector({
        key: 'charCountState', // unique ID
        get: ({get}) => {
            const text = get(textState);
            return text.length;
        }
    });

    const TextInput = () => {
        const [text, setText] = useRecoilState(textState);

        const onChange = (event) => {
            setText(event.target.value);
        };

        return (
            <div>
                <input type={"text"} value={text} onChange={onChange} />
                <br />
                Echo: {text}
            </div>
        );
    };

    const CharacterCount = () => {
        const count = useRecoilValue(charCountState);

        return <>Character Count: {count}</>
    }


    return (
        <div>
            <TextInput />
            <CharacterCount />
        </div>
    )
}

