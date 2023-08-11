# Guides
## Atom Effects

# Reference API

## `<RecoilRoot>`
 - 값을 갖는 atoms 컨텍스트를 제공
 - Recoil의 hooks를 사용하는 모든 Components보다 상위에 존재해야 함
    
### 속성
 - `initializeState?: (MutableSnapshot => void)`
   - `<RecoilRoot>`의 atom 상태를 초기화하기 위해 [MutableSnapshot](#transforming-snapshots)을 사용하는 옵션 함수
   - 초기 렌더링과 관련
   - 이후의 상태변경 또는 비동기적인 초기화를 위한 방법은 아님
   - 비동기 상태변경의 경우 [useSetRecoilState()](#usesetrecoilstate) 또는 [useRecoilCallback()](#userecoilcallback)와 같은 Hook을 사용
 - `override?: boolean`
   - default: `true`
   - `<RecoilRoot>`가 다른 `<RecoilRoot>`와 중첩되어 있는 경우 사용
   - `true`: 새로운 스코프를 생성
   - `false`: 해당 RecoilRoot가 자식 렌더링 외의 다른 기능을 수행하지 않음
     - 자식 RecoilRoot들은 가장 가까운 조상 RecoilRoot의 Recoil 값에 엑세스하게 됨

### 여러 개의 <RecoilRoot> 사용하기
 - 여러 개의 `<RecoilRoot>`는 동시에 존재할 수 있으며, 각각 독립적인 atom 상태에 대한 provider/store가 됨
 - atom 상태는 각 Root 별로 분리되어 있음
   - RecoilRoot의 `override` 속성을 `false`로  지정하지 않는다면, 루트가 다른 루트에 중첩될 때 이와같이 동작함
 - selector cache와 같은 캐시들은 루트 사이에 공유될 수 있음
 - Selector evaluation은 캐싱 또는 로깅을 제외하고는 멱등성(연산을 여러 번 적용하더라도 결과가 달라지지 않음)을 가지므로 일반적으로 큰 문제가 되지 않음
   - 그러나 observable하며 루트들 간에 중복 쿼리가 캐싱될 수도 있음
   - 캐시는 [useRecoilRefresher_UNSTABLE()](#userecoilrefresher)을 사용해 비울 수 있음

### Example
 - ```javascript
   import {RecoilRoot} from 'recoil';

   function AppRoot() {
       return (
           <RecoilRoot>
               <ComponentThatUsesRecoil />
           </RecoilRoot>
       );
   }
   ```

## State
### `atom(options)`

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
     - `Promise`, [Loadable](#loadable), wrapped value 또는 같은 타입의 다른 atom/selector 등이 기본 값으로 사용될 수 있음
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
 - [useRecoilState()](#userecoilstate)
   - atom을 읽거나 쓰기에 사용할 때 사용
   - 이 훅은 atom에 컴포넌트를 구독시킴
 - [useRecoilValue()](#userecoilvalue)
   - atom을 읽기만 할 때 사용
   - 이 훅은 atom에 컴포넌트를 구독시킴
 - [useSetRecoilState()](#usesetrecoilstate)
   - atom을 쓰기만 할 때 사용
 - [useResetRecoilState()](#useresetrecoilstate)
   - atom의 값을, atom 선언 시 세팅된 기본값으로 리셋할 때 사용

가끔 가다가 atom의 값을 컴포넌트 구독 없이 읽을 필요가 있는 경우, [useRecoilCallback()](#userecoilcallback) 참고

같은 타입의 static value, `Promise`, `RecoilValue` 값으로 atom을 초기화할 수 있음
왜냐하면 `Promise`는 pending 상태이거나, 기본 selector는 비동기로 동작할 것인데, 이는 atom 값 또한 pending 상태이거나 값을 읽을 때 에러를 발생시킬 것이기 때문
현재 `Promise`를 atom에 할당할 수 없으므로, 비동기 함수를 써야하는 경우 [selectors()](#selectors)를 사용해야 함

atom은 `Promise`나 `RecoilValue`를 직접적으로 저장하는 용도로 사용할 수는 없지만, 객체로 감쌀 수는 있음
atom은 순수한 형태라면 `function`을 통해 설정할 수 있지만, setter를 updater의 형태로 사용해야 할 수도 있음 (ex. `set(myAtom, () => myFunc);`)

#### example
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

#### Atom Families
 - [atomFamily()](#atomfamily)는 관계가 있는 상태들의 컬렉션을 정렬하거나, [scoped atoms](#scoped-atoms)에서 유용하게 쓰일 수 있음


### `selectors()`
### `Loadable`
### `useRecoilState()`
### `useRecoilValue()`
### `useSetRecoilState()`
### `useResetRecoilState()`
### `useRecoilRefresher()`

## Utils
### atomFamily()
#### Scoped Atoms

## `useRecoilTransaction()`
## `useRecoilCallback()`
## class `Snapshot`
### Transforming Snapshots
## 기타