# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListUserTransactions*](#listusertransactions)
  - [*GetPublicCategories*](#getpubliccategories)
- [**Mutations**](#mutations)
  - [*CreateCategoryForUser*](#createcategoryforuser)
  - [*UpdateUserDisplayName*](#updateuserdisplayname)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListUserTransactions
You can execute the `ListUserTransactions` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listUserTransactions(): QueryPromise<ListUserTransactionsData, undefined>;

interface ListUserTransactionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUserTransactionsData, undefined>;
}
export const listUserTransactionsRef: ListUserTransactionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listUserTransactions(dc: DataConnect): QueryPromise<ListUserTransactionsData, undefined>;

interface ListUserTransactionsRef {
  ...
  (dc: DataConnect): QueryRef<ListUserTransactionsData, undefined>;
}
export const listUserTransactionsRef: ListUserTransactionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listUserTransactionsRef:
```typescript
const name = listUserTransactionsRef.operationName;
console.log(name);
```

### Variables
The `ListUserTransactions` query has no variables.
### Return Type
Recall that executing the `ListUserTransactions` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListUserTransactionsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListUserTransactionsData {
  transactions: ({
    id: UUIDString;
    description: string;
    amount: number;
    date: DateString;
    type: string;
    account: {
      name: string;
      bankName?: string | null;
    };
      category: {
        name: string;
      };
  } & Transaction_Key)[];
}
```
### Using `ListUserTransactions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listUserTransactions } from '@dataconnect/generated';


// Call the `listUserTransactions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listUserTransactions();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listUserTransactions(dataConnect);

console.log(data.transactions);

// Or, you can use the `Promise` API.
listUserTransactions().then((response) => {
  const data = response.data;
  console.log(data.transactions);
});
```

### Using `ListUserTransactions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listUserTransactionsRef } from '@dataconnect/generated';


// Call the `listUserTransactionsRef()` function to get a reference to the query.
const ref = listUserTransactionsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listUserTransactionsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.transactions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.transactions);
});
```

## GetPublicCategories
You can execute the `GetPublicCategories` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getPublicCategories(): QueryPromise<GetPublicCategoriesData, undefined>;

interface GetPublicCategoriesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPublicCategoriesData, undefined>;
}
export const getPublicCategoriesRef: GetPublicCategoriesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getPublicCategories(dc: DataConnect): QueryPromise<GetPublicCategoriesData, undefined>;

interface GetPublicCategoriesRef {
  ...
  (dc: DataConnect): QueryRef<GetPublicCategoriesData, undefined>;
}
export const getPublicCategoriesRef: GetPublicCategoriesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getPublicCategoriesRef:
```typescript
const name = getPublicCategoriesRef.operationName;
console.log(name);
```

### Variables
The `GetPublicCategories` query has no variables.
### Return Type
Recall that executing the `GetPublicCategories` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetPublicCategoriesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetPublicCategoriesData {
  categories: ({
    id: UUIDString;
    name: string;
    type: string;
    description?: string | null;
    icon?: string | null;
  } & Category_Key)[];
}
```
### Using `GetPublicCategories`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getPublicCategories } from '@dataconnect/generated';


// Call the `getPublicCategories()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getPublicCategories();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getPublicCategories(dataConnect);

console.log(data.categories);

// Or, you can use the `Promise` API.
getPublicCategories().then((response) => {
  const data = response.data;
  console.log(data.categories);
});
```

### Using `GetPublicCategories`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getPublicCategoriesRef } from '@dataconnect/generated';


// Call the `getPublicCategoriesRef()` function to get a reference to the query.
const ref = getPublicCategoriesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getPublicCategoriesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.categories);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.categories);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateCategoryForUser
You can execute the `CreateCategoryForUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createCategoryForUser(vars: CreateCategoryForUserVariables): MutationPromise<CreateCategoryForUserData, CreateCategoryForUserVariables>;

interface CreateCategoryForUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCategoryForUserVariables): MutationRef<CreateCategoryForUserData, CreateCategoryForUserVariables>;
}
export const createCategoryForUserRef: CreateCategoryForUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createCategoryForUser(dc: DataConnect, vars: CreateCategoryForUserVariables): MutationPromise<CreateCategoryForUserData, CreateCategoryForUserVariables>;

interface CreateCategoryForUserRef {
  ...
  (dc: DataConnect, vars: CreateCategoryForUserVariables): MutationRef<CreateCategoryForUserData, CreateCategoryForUserVariables>;
}
export const createCategoryForUserRef: CreateCategoryForUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createCategoryForUserRef:
```typescript
const name = createCategoryForUserRef.operationName;
console.log(name);
```

### Variables
The `CreateCategoryForUser` mutation requires an argument of type `CreateCategoryForUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateCategoryForUserVariables {
  name: string;
  type: string;
  description?: string | null;
  icon?: string | null;
}
```
### Return Type
Recall that executing the `CreateCategoryForUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateCategoryForUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateCategoryForUserData {
  category_insert: Category_Key;
}
```
### Using `CreateCategoryForUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createCategoryForUser, CreateCategoryForUserVariables } from '@dataconnect/generated';

// The `CreateCategoryForUser` mutation requires an argument of type `CreateCategoryForUserVariables`:
const createCategoryForUserVars: CreateCategoryForUserVariables = {
  name: ..., 
  type: ..., 
  description: ..., // optional
  icon: ..., // optional
};

// Call the `createCategoryForUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createCategoryForUser(createCategoryForUserVars);
// Variables can be defined inline as well.
const { data } = await createCategoryForUser({ name: ..., type: ..., description: ..., icon: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createCategoryForUser(dataConnect, createCategoryForUserVars);

console.log(data.category_insert);

// Or, you can use the `Promise` API.
createCategoryForUser(createCategoryForUserVars).then((response) => {
  const data = response.data;
  console.log(data.category_insert);
});
```

### Using `CreateCategoryForUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createCategoryForUserRef, CreateCategoryForUserVariables } from '@dataconnect/generated';

// The `CreateCategoryForUser` mutation requires an argument of type `CreateCategoryForUserVariables`:
const createCategoryForUserVars: CreateCategoryForUserVariables = {
  name: ..., 
  type: ..., 
  description: ..., // optional
  icon: ..., // optional
};

// Call the `createCategoryForUserRef()` function to get a reference to the mutation.
const ref = createCategoryForUserRef(createCategoryForUserVars);
// Variables can be defined inline as well.
const ref = createCategoryForUserRef({ name: ..., type: ..., description: ..., icon: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createCategoryForUserRef(dataConnect, createCategoryForUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.category_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.category_insert);
});
```

## UpdateUserDisplayName
You can execute the `UpdateUserDisplayName` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateUserDisplayName(vars: UpdateUserDisplayNameVariables): MutationPromise<UpdateUserDisplayNameData, UpdateUserDisplayNameVariables>;

interface UpdateUserDisplayNameRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateUserDisplayNameVariables): MutationRef<UpdateUserDisplayNameData, UpdateUserDisplayNameVariables>;
}
export const updateUserDisplayNameRef: UpdateUserDisplayNameRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateUserDisplayName(dc: DataConnect, vars: UpdateUserDisplayNameVariables): MutationPromise<UpdateUserDisplayNameData, UpdateUserDisplayNameVariables>;

interface UpdateUserDisplayNameRef {
  ...
  (dc: DataConnect, vars: UpdateUserDisplayNameVariables): MutationRef<UpdateUserDisplayNameData, UpdateUserDisplayNameVariables>;
}
export const updateUserDisplayNameRef: UpdateUserDisplayNameRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateUserDisplayNameRef:
```typescript
const name = updateUserDisplayNameRef.operationName;
console.log(name);
```

### Variables
The `UpdateUserDisplayName` mutation requires an argument of type `UpdateUserDisplayNameVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateUserDisplayNameVariables {
  displayName: string;
}
```
### Return Type
Recall that executing the `UpdateUserDisplayName` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateUserDisplayNameData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateUserDisplayNameData {
  user_update?: User_Key | null;
}
```
### Using `UpdateUserDisplayName`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateUserDisplayName, UpdateUserDisplayNameVariables } from '@dataconnect/generated';

// The `UpdateUserDisplayName` mutation requires an argument of type `UpdateUserDisplayNameVariables`:
const updateUserDisplayNameVars: UpdateUserDisplayNameVariables = {
  displayName: ..., 
};

// Call the `updateUserDisplayName()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateUserDisplayName(updateUserDisplayNameVars);
// Variables can be defined inline as well.
const { data } = await updateUserDisplayName({ displayName: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateUserDisplayName(dataConnect, updateUserDisplayNameVars);

console.log(data.user_update);

// Or, you can use the `Promise` API.
updateUserDisplayName(updateUserDisplayNameVars).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

### Using `UpdateUserDisplayName`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateUserDisplayNameRef, UpdateUserDisplayNameVariables } from '@dataconnect/generated';

// The `UpdateUserDisplayName` mutation requires an argument of type `UpdateUserDisplayNameVariables`:
const updateUserDisplayNameVars: UpdateUserDisplayNameVariables = {
  displayName: ..., 
};

// Call the `updateUserDisplayNameRef()` function to get a reference to the mutation.
const ref = updateUserDisplayNameRef(updateUserDisplayNameVars);
// Variables can be defined inline as well.
const ref = updateUserDisplayNameRef({ displayName: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateUserDisplayNameRef(dataConnect, updateUserDisplayNameVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

