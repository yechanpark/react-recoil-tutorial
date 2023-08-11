# `<RecoilRoot>`
- 값을 갖는 atoms 컨텍스트를 제공
- Recoil의 hooks를 사용하는 모든 Components보다 상위에 존재해야 함

## Props
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

## Using Multiple `<RecoilRoot>`s
- 여러 개의 `<RecoilRoot>`는 동시에 존재할 수 있으며, 각각 독립적인 atom 상태에 대한 provider/store가 됨
- atom 상태는 각 Root 별로 분리되어 있음
  - RecoilRoot의 `override` 속성을 `false`로  지정하지 않는다면, 루트가 다른 루트에 중첩될 때 이와같이 동작함
- selector cache와 같은 캐시들은 루트 사이에 공유될 수 있음
- Selector evaluation은 캐싱 또는 로깅을 제외하고는 멱등성(연산을 여러 번 적용하더라도 결과가 달라지지 않음)을 가지므로 일반적으로 큰 문제가 되지 않음
  - 그러나 observable하며 루트들 간에 중복 쿼리가 캐싱될 수도 있음
  - 캐시는 [useRecoilRefresher_UNSTABLE()](#userecoilrefresher)을 사용해 비울 수 있음

## Example
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