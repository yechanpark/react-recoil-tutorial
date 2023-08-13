# Asynchronous Data Queries
 - Recoil은 데이터 플로우 그래프를 통해 상태를 매핑하는 방법과 도출된 상태를 리액트 컴포넌트에 제공
 - 강력한 점은, 그래프 내의 함수들도 비동기로 동작할 수 있다는 것
 - 이것은 리액트 컴포넌트 렌더 함수에서 비동기 함수를 쓰기 쉽게 만들어줌
 - Recoil은 동기, 비동기 함수를 selectors의 데이터 플로우 그래프에 균일하게 혼합하게 해줌
 - Selector의 `get` 콜백에서 나온 값 그 자체 대신, Promise를 값으로 리턴하면 인터페이스는 동일하게 유지됨
 - 그 이유는 Selector일 뿐이므로 다른 selector들에 의존해 데이터를 추가로 변환할 수도 있음
 - Selector들은 비동기 데이터를 Recoil의 데이터 플로우 그래프로 포함하는 방법 중 하나로 사용될 수 있음
 - Selector들은 "멱등성" 함수를 대표하는 것이라는 것을 기억해야 함
   - 따라서 입력이 제공되면, 항상 같은 결과를 리턴하게 됨
   - 단, 이는 최소한 어플리케이션 라이프타임 내에서 이루어지게 됨
   - 이는 selector에 대한 평가가 캐싱되거나, 재시작되거나, 여러번 처리될 수 있기 때문에 중요함
   - 이러한 이유 때문에, selector들은 일반적으로 읽기 전용 DB 쿼리 모델에 좋은 방안이 됨
   - 변경 가능한 데이터는 [Query Refresh](#query-refresh)를 참고
     - 또는 변경 가능한 상태를 동기화하거나, 상태를 유지하거나, 다른 사이드이펙트에 대해서는 [Atom Effects](./AtomEffects.md) API 또는 [Recoil Sync Library](https://recoiljs.org/docs/recoil-sync/introduction) 사용을 고려 

## Synchronous Example
 - [atom](../APIReference/state/atom.md) 과 [selector](../APIReference/state/selector.md) 를 동기방식으로 user name을 얻는 간단한 예제
 - ```javascript
   const currentUserIDState = atom({
       key: 'CurrentUserID',
       default: 1,
   });
   
   const currentUserNameState = selector({
       key: 'CurrentUserName',
       get: ({get}) => {
           return tableOfUsers[get(currentUserIDState)].name;
       },
   });
   
   function CurrentUserInfo() {
       const userName = useRecoilValue(currentUserNameState);
       return <div>{userName}</div>;
   }
   
   function MyApp() {
       return (
           <RecoilRoot>
               <CurrentUserInfo />
           </RecoilRoot>
       );
   }
   ```

## Asynchronous Example
 - 만약 user name이 어떤 db에 저장되어있고 이를 쿼리해야 한다면, `async` 함수를 사용하거나 `Promise`를 리턴하도록 하면 됨
 - 만약 의존하는 값들이 변경되면, selector는 이를 재평가하고 새로운 쿼리를 처리함
 - 결과는 캐싱되며, 쿼리는 특정 input 당 1번만 처리하게 됨
 - ```javascript
   const currentUserNameQuery = selector({
       key: 'CurrentUserName',
       get: async ({get}) => {
           const response = await myDBQuery({
               userID: get(currentUserIDState),
           });
           return response.name;
       },
   });
   
   function CurrentUserInfo() {
       const userName = useRecoilValue(currentUserNameQuery);
       return <div>{userName}</div>;
   }
   ```
 - selector의 인터페이스는 동일하기 때문에, 이 selector를 사용하는 컴포넌트는 atom 상태 동기화, 도출된 selector 상태, 비동기 쿼리에 대해 신경 쓸 필요가 없음
 - 하지만 React의 동기 함수들은 동기방식으로 동작하기 때문에, Promise가 resolve 되기 전에 특정 렌더링을 제공해야 할 수 있음
 - Recoil은 보류중인 데이터 처리를 위해 [React Suspense](https://reactjs.org/docs/concurrent-mode-suspense.html)와 동작하도록 설계되었음
 - 해당 컴포넌트를 Suspense 범위 내에 감싸면 어떤 자손 컴포넌트가 보류중인 동안 fallback UI를 제공하게 됨
   - ```javascript
     function MyApp() {
         return (
             <RecoilRoot>
                 <React.Suspense fallback={<div>Loading...</div>}>
                     <CurrentUserInfo />
                 </React.Suspense>
             </RecoilRoot>
         );
     }
     ``` 

## Error Handling
 - Recoil selector들은 컴포넌트가 해당 값을 사용하려고 할 때 발생하는 에러를 던질 수 있음
   - 이것은 React의 `<ErrorBoundary>`를 통해 잡아낼 수 있음
 - ```javascript
   const currentUserNameQuery = selector({
       key: 'CurrentUserName',
       get: async ({get}) => {
           const response = await myDBQuery({
               userID: get(currentUserIDState),
           });
           if (response.error) {
               throw response.error;
           }
           return response.name;
       },
   });
   
   function CurrentUserInfo() {
       const userName = useRecoilValue(currentUserNameQuery);
       return <div>{userName}</div>;
   }
   
   function MyApp() {
       return (
           <RecoilRoot>
               <ErrorBoundary>
                   <React.Suspense fallback={<div>Loading...</div>}>
                       <CurrentUserInfo />
                   </React.Suspense>
               </ErrorBoundary>
           </RecoilRoot>
       );
   }
   ```

## Queries with Parameters
 - 때로는 도출된 상태 기반이 아닌 파라미터를 기반으로 쿼리를 하고싶을 때가 있을 수 있음
   - 예를 들면, component props 기반의 쿼리를 원할 수 있음
 - 이런 경우 [selectorFamily()](../APIReference/utils/selectorFamily.md) helper를 사용할 수 있음
 - ```javascript
   const userNameQuery = selectorFamily({
       key: 'UserName',
       get: userID => async () => {
           const response = await myDBQuery({userID});
           if (response.error) {
               throw response.error;
           }
           return response.name;
       },
   });
   
   function UserInfo({userID}) {
       const userName = useRecoilValue(userNameQuery(userID));
       return <div>{userName}</div>;
   }
   
   function MyApp() {
       return (
           <RecoilRoot>
               <ErrorBoundary>
                   <React.Suspense fallback={<div>Loading...</div>}>
                       <UserInfo userID={1}/>
                       <UserInfo userID={2}/>
                       <UserInfo userID={3}/>
                   </React.Suspense>
               </ErrorBoundary>
           </RecoilRoot>
       );
   }
   ```

## Data-Flow Graph
 - 쿼리를 selector 로 모델링하면, 상태, 도출된 상태, 쿼리를 혼합할 수 있는 data-flow graph를 빌드할 수 있음
 - 이 그래프는 상태가 변경되면, 리액트 컴포넌트를 자동으로 업데이트하고 re-render함
 - 아래 예시는 현재 user's name과 친구 목록을 렌더링하는 예제
   - 만약 친구 이름을 클릭하면, 현재 유저가 되고 이름과 목록이 자동으로 업데이트됨
 - ```javascript
   const currentUserIDState = atom({
       key: 'CurrentUserID',
       default: null,
   });
   
   const userInfoQuery = selectorFamily({
       key: 'UserInfoQuery',
       get: userID => async () => {
           const response = await myDBQuery({userID});
           if (response.error) {
               throw response.error;
           }
           return response;
       },
   });
   
   const currentUserInfoQuery = selector({
       key: 'CurrentUserInfoQuery',
       get: ({get}) => get(userInfoQuery(get(currentUserIDState))),
   });
   
   const friendsInfoQuery = selector({
       key: 'FriendsInfoQuery',
       get: ({get}) => {
           const {friendList} = get(currentUserInfoQuery);
           return friendList.map(friendID => get(userInfoQuery(friendID)));
       },
   });
   
   function CurrentUserInfo() {
       const currentUser = useRecoilValue(currentUserInfoQuery);
       const friends = useRecoilValue(friendsInfoQuery);
       const setCurrentUserID = useSetRecoilState(currentUserIDState);
       return (
           <div>
               <h1>{currentUser.name}</h1>
               <ul>
                   {friends.map(friend =>
                       <li key={friend.id} onClick={() => setCurrentUserID(friend.id)}>
                           {friend.name}
                       </li>
                   )}
               </ul>
           </div>
       );
   }
   
   function MyApp() {
       return (
           <RecoilRoot>
               <ErrorBoundary>
                   <React.Suspense fallback={<div>Loading...</div>}>
                       <CurrentUserInfo />
                   </React.Suspense>
               </ErrorBoundary>
           </RecoilRoot>
       );
   }
   ```

## Concurrent Requests
 - [Data-Flow Graph](#data-flow-graph)의 예시에서, `friendsInfoQuery`는 각 친구의 정보를 얻기 위해 쿼리를 사용함
 - 하지만, 이것 때문에 loop 내에서 본질적으로 serialized됨
 - 조회가 빠르다면 괜찮지만, 만약 무거운 편이라면 [waitForAll](../APIReference/utils/waitForAll.md) 같은 concurrency helper를 사용해 병렬로 처리할 수 있음
   - 이 헬퍼는 의존성이 있는 array와 named 오브젝트를 허용함
 - ```javascript
   const friendsInfoQuery = selector({
       key: 'FriendsInfoQuery',
       get: ({get}) => {
           const {friendList} = get(currentUserInfoQuery);
           const friends = get(waitForAll(
               friendList.map(friendID => userInfoQuery(friendID))
           ));
           return friends;
       },
   });
   ```
 - 부분적인 데이터를 추가적으로 UI에 업데이트하는 경우는 [waitForNone](../APIReference/utils/waitForNone.md)을 사용할 수 있음
 - ```javascript
   const friendsInfoQuery = selector({
       key: 'FriendsInfoQuery',
       get: ({get}) => {
           const {friendList} = get(currentUserInfoQuery);
           const friendLoadables = get(waitForNone(
               friendList.map(friendID => userInfoQuery(friendID))
           ));
           return friendLoadables
                   .filter(({state}) => state === 'hasValue')
                   .map(({contents}) => contents);
       },
   });
   ```

## Pre-Fetching
 - 성능 상의 이유로, redering 전에 fetching을 원할 수도 있음
 - 이 방법을 통해 렌더링을 시작하는 동안 쿼리가 수행될 수 있음
 - [React docs](https://reactjs.org/docs/concurrent-mode-suspense.html#start-fetching-early)에서 몇 가지 샘플이 있으며, 이 패턴은 Recoil과도 잘 호환됨
 - 위 예시에서 사용자가 버튼을 클릭해 사용자를 변경하는 즉시 다음 사용자 정보에 대한 정보를 가져오도록 변경
 - ```javascript
   function CurrentUserInfo() {
       const currentUser = useRecoilValue(currentUserInfoQuery);
       const friends = useRecoilValue(friendsInfoQuery);
   
       const changeUser = useRecoilCallback(({snapshot, set}) => userID => {
           snapshot.getLoadable(userInfoQuery(userID)); // pre-fetch user info
           set(currentUserIDState, userID); // change current user to start new render
       });
   
       return (
           <div>
               <h1>{currentUser.name}</h1>
               <ul>
                   {friends.map(friend =>
                       <li key={friend.id} onClick={() => changeUser(friend.id)}>
                           {friend.name}
                       </li>
                   )}
               </ul>
           </div>
       );
   }
   ```
 - pre-fetching은 [selectorFamily()](../APIReference/utils/selectorFamily.md)를 트리거하여 비동기 쿼리를 수행시키고 selector의 캐시를 채움
 - 만약 [atomFamily()](../APIReference/utils/atomFamily.md)를 사용한다면, atom 또는 atom effect에 의존해 세팅하는 경우 모두 [useRecoilCallback()](../APIReference/useRecoilCallback.md) 대신 [useRecoilTransaction_UNSTABLE()](../APIReference/useRecoilTransaction.md)을 사용해야 함
 - 그렇지 않고 제공된 `Snapshot`의 상태를 세팅하려고 하면 `<RecoilRoot>` 내의 라이브 상태에 영향을 미치지 않게 됨
 
## Query Default Atom Values
 - 기본적인 패턴은 local editable state를 표현하기 위해 atom을 사용하는 것이지만, 쿼리의 기본 값을 위해서는 `Promise`를 사용
 - ```javascript
   const currentUserIDState = atom({
       key: 'CurrentUserID',
       default: myFetchCurrentUserID(),
   });
   ```
 - 또는 selector를 사용하여 쿼리를 지연하거나 다른 상태에 의존함
 - selector를 사용할 때, 기본 atom 값은 동적으로 남아있게 되며 atom이 유저에 의해 명시적으로 세팅되기 전 까지 selector 업데이트 시 함께 업데이트됨
 - ```javascript
   const UserInfoState = atom({
       key: 'UserInfo',
       default: selector({
           key: 'UserInfo/Default',
           get: ({get}) => myFetchUserInfo(get(currentUserIDState)),
       }),
   });
   ```
 - 이는 atom families와 함께 사용될 수도 있음
 - ```javascript
   const userInfoState = atomFamily({
       key: 'UserInfo',
       default: id  => myFetchUserInfo(id),
   });
   ```
 - ```javascript
   const userInfoState = atomFamily({
       key: 'UserInfo',
       default: selectorFamily({
           key: 'UserInfo/Default',
           get: id => ({get}) => myFetchUserInfo(id, get(paramsState)),
       }),
   });
   ```
 - 만약 데이터를 양방향으로 동기화해야 한다면, [atom effects](AtomEffects.md)를 참고

## Async Queries Without React Suspense
 - 보류중인 비동기 selector를 다룰 때, React Suspense를 사용하는 것은 필수가 아님
 - [useRecoilValueLoadable()](../APIReference/state/useRecoilValueLoadable.md) hook은 현재 상태를 렌더링하는 동안 결정함

## Query Refresh
 - 데이터 쿼리를 모델하기 위해 selector를 사용할 때, selector 평가는 항상 주어진 상태에 대해 일관된 값을 제공해야 함
 - Selector는 다른 atom 과 selector에서 도출된 상태를 표현함
 - 따라서 selector 평가 함수는 입력이 주어지면 캐싱되거나 여러 번 수행하는데 있어서 멱등성을 만족해야 함
 - 그러나 만약 selector가 데이터 쿼리에서 부터 얻은 데이터가 다시 쿼리되어 새로운 데이터를 얻거나 실패 후 재시도할 수 있게 된다면 도움이 될 것임
 - 이를 위해 몇 가지 방법이 존재함
### `useRecoilRefresher()`
 - [useRecoilRefresher_UNSTABLE()](../APIReference/state/useRecoilRefresher_UNSTABLE.md) hook은 어떤 캐시를 비우거나 재평가할 수 있는 콜백을 얻기 위해 사용할 수 있음
 - ```javascript
   const userInfoQuery = selectorFamily({
       key: 'UserInfoQuery',
       get: userID => async () => {
           const response = await myDBQuery({userID});
           if (response.error) {
               throw response.error;
           }
           return response.data;
       }
   })
   
   function CurrentUserInfo() {
       const currentUserID = useRecoilValue(currentUserIDState);
       const currentUserInfo = useRecoilValue(userInfoQuery(currentUserID));
       const refreshUserInfo = useRecoilRefresher_UNSTABLE(userInfoQuery(currentUserID));
   
       return (
           <div>
               <h1>{currentUserInfo.name}</h1>
               <button onClick={() => refreshUserInfo()}>Refresh</button>
           </div>
       );
   }
   ```
 
### `Use a Request ID`
 - Selector 평가는 input(의존한 상태 또는 family 파라미터)에 기반하여 일관된 상태값을 제공해야 함
 - 따라서, request ID를 family parameter에 추가하거나 쿼리에 추가할 수 있음
 - ```javascript
   const userInfoQueryRequestIDState = atomFamily({
       key: 'UserInfoQueryRequestID',
       default: 0,
   });
   
   const userInfoQuery = selectorFamily({
       key: 'UserInfoQuery',
       get: userID => async ({get}) => {
           get(userInfoQueryRequestIDState(userID)); // Add request ID as a dependency
           const response = await myDBQuery({userID});
           if (response.error) {
               throw response.error;
           }
           return response.data;
       },
   });
   
   function useRefreshUserInfo(userID) {
       const setUserInfoQueryRequestID = useSetRecoilState(userInfoQueryRequestIDState(userID));
       return () => {
           setUserInfoQueryRequestID(requestID => requestID + 1);
       };
   }
   
   function CurrentUserInfo() {
       const currentUserID = useRecoilValue(currentUserIDState);
       const currentUserInfo = useRecoilValue(userInfoQuery(currentUserID));
       const refreshUserInfo = useRefreshUserInfo(currentUserID);
   
       return (
           <div>
               <h1>{currentUserInfo.name}</h1>
               <button onClick={refreshUserInfo}>Refresh</button>
           </div>
       );
   }
   ```

### Use an Atom
 - 다른 옵션은 selector 대신 atom을 사용하여 쿼리 결과를 모델링하는 것
 - refresh 정책에 따라서, 새로운 쿼리 결과를 atom state에 반드시 업데이트되게 할 수 있음
 - ```javascript
   const userInfoState = atomFamily({
       key: 'UserInfo',
       default: userID => fetch(userInfoURL(userID)),
   });
   
   // React component to refresh query
   function RefreshUserInfo({userID}) {
       const refreshUserInfo = useRecoilCallback(({set}) => async id => {
       const userInfo = await myDBQuery({userID});
       set(userInfoState(userID), userInfo);
       }, [userID]);
   
       // Refresh user info every second
       useEffect(() => {
       const intervalID = setInterval(refreshUserInfo, 1000);
       return () => clearInterval(intervalID);
       }, [refreshUserInfo]);
   
       return null;
   }
   ```
 - atom은 현재 새로운 값으로 `Promise`를 받는 것을 허용하지 않음
 - 따라서 사용자가 원한다고 하더라도 쿼리 refresh가 보류중일 때는, atom을 React Suspense에 대해 보류상태로 둘 수 없음
   - 그러나 현재 로딩 상태와 실제 결과를 명시적으로 인코딩하는 객체를 저장할 수 있음 
 - 또한 atom의 쿼리 동기화를 위해 [atom effects](AtomEffects.md)를 고려할 수 있음

### Retry query from error message
 - `<ErrorBoundary>` 내에서 던져지고 탐지된 에러를 기반으로 쿼리를 찾고 재시도 하는 예시
 - ```javascript
   function QueryErrorMessage({error}) {
       const snapshot = useRecoilSnapshot();
       const selectors = useMemo(() => {
           const ret = [];
           for (const node of snapshot.getNodes_UNSTABLE({isInitialized: true})) {
               const {loadable, type} = snapshot.getInfo_UNSTABLE(node);
               if (loadable != null && loadable.state === 'hasError' && loadable.contents === error) {
                   ret.push(node);
               }
           }
           return ret;
       }, [snapshot, error]);
   
       const retry = useRecoilCallback(({refresh}) =>
           () => selectors.forEach(refresh),
           [selectors],
       );
   
       return selectors.length > 0 && (
           <div>
               Error: {error.toString()}
               Query: {selectors[0].key}
               <button onClick={retry}>Retry</button>
           </div>
       );
   }
   ```