# `atom(options)`

---
atom은 Recoil 내의 상태를 표현
- `atom()` 함수는 수정 가능한 `RecoilState` 객체를 리턴
- ```javascript
   function atom<T>({
       key: string,
       default?: T | Promise<T> | Loadable<T> | WrappedValue<T> | RecoilValue<T>,
       effects?: $ReadOnlyArray<AtomEffect<T>>,
       dangerouslyAllowMutability?: boolean,
   }): RecoilState<T>
   ```
    - `key`
        - 내부적으로 atom에 대한 식별자로 사용되는 단일 문자열
        - 전체 애플리케이션 안에서 atoms, selectors는 모두 각각 구분될 수 있는 식별자를 사용해야 함
    - `default`
        - atom의 기본값
        - `Promise`, [Loadable](Loadable.md), wrapped value 또는 같은 타입의 다른 atom/selector 등이 기본 값으로 사용될 수 있음
        - 만약 selector가 기본 값으로 사용되는 경우, atom은 해당 selector가 update될 때 동적으로 업데이트 됨
            - 한 번 atom이 설정되면, atom이 재설정되기 전 까지 값을 유지
        - 만약 `default`가 제공되지 않으면, `null` 또는 `undefined`가 설정되는 것과 다르게, atom은 "pending" 상태로 시작하게 되고 세팅되기 전 까지 Suspense를 트리거 함
        - `Promise`, `Loadable`, atom, selector 또는 function을 언래핑하지 않고 기본값으로 사용하는 경우, `atom.value(...)`를 통해 래핑할 수 있음
    - `effects`
        - atom에 대한 [Atom Effects](#atom-effects) 배열 옵션
    - `dangerouslyAllowMutability `
        - 때로는 상태 변경을 나타내지 않는 atoms에 저장된 객체의 상태 변경을 허용하길 바라는 때가 있을 수 있음
        - 개발 모드에서 이 옵션을 사용해 이러한 객체를 재정의할 수 있음
---
Recoil은 atom의 상태 변화를 관리하여, 해당 atom의 상태 변화를 구독하는 다른 컴포넌트들에게 알려 re-render 시키므로, atom 상태변화를 위해서는 아래와 같은 hooks를 사용해야 함
만약 atom 내에 저장된 객체가 직접적으로 수정되는 경우, 이를 통과시키고 구독하는 컴포넌트들에게 알리지 않은 상태에서 업데이트 될 수 있음
이러한 버그를 탐지하는 것을 도와주기 위해, Recoil은 개발 모드에서 atoms 내에 저장된 객체를 freeze 시킴

대부분, atoms와 상호작용하기 위해 다음 hooks를 사용
- [useRecoilState()](useRecoilState.md)
    - atom을 읽거나 쓰기에 사용할 때 사용
    - 이 훅은 atom에 컴포넌트를 구독시킴
- [useRecoilValue()](useRecoilValue.md)
    - atom을 읽기만 할 때 사용
    - 이 훅은 atom에 컴포넌트를 구독시킴
- [useSetRecoilState()](useSetRecoilState.md)
    - atom을 쓰기만 할 때 사용
- [useResetRecoilState()](useResetRecoilState.md)
    - atom의 값을, atom 선언 시 세팅된 기본값으로 리셋할 때 사용

가끔 가다가 atom의 값을 컴포넌트 구독 없이 읽을 필요가 있는 경우, [useRecoilCallback()](../useRecoilCallback.md) 참고

같은 타입의 static value, `Promise`, `RecoilValue` 값으로 atom을 초기화할 수 있음
왜냐하면 `Promise`는 pending 상태이거나, 기본 selector는 비동기로 동작할 것인데, 이는 atom 값 또한 pending 상태이거나 값을 읽을 때 에러를 발생시킬 것이기 때문
현재 `Promise`를 atom에 할당할 수 없으므로, 비동기 함수를 써야하는 경우 [selector()](selector.md)를 사용해야 함

atom은 `Promise`나 `RecoilValue`를 직접적으로 저장하는 용도로 사용할 수는 없지만, 객체로 감쌀 수는 있음
atom은 순수한 형태라면 `function`을 통해 설정할 수 있지만, setter를 updater의 형태로 사용해야 할 수도 있음 (ex. `set(myAtom, () => myFunc);`)

## example
- ```javascript
   import {atom, useRecoilState} from 'recoil';
   
   const counter = atom({
       key: 'myCounter',
       default: 0,
   });
   
   function Counter() {
       const [count, setCount] = useRecoilState(counter);
       const incrementByOne = () => setCount(count + 1);
   
       return (
           <div>
               Count: {count}
               <br />
               <button onClick={incrementByOne}>Increment</button>
           </div>
       );
   }
   ```

## Atom Families
- [atomFamily()](../utils/atomFamily.md)는 관계가 있는 상태들의 컬렉션을 정렬하거나, [scoped atoms](../utils/atomFamily.md#scoped-atoms)에서 유용하게 쓰일 수 있음