import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Account_Key {
  id: UUIDString;
  __typename?: 'Account_Key';
}

export interface Budget_Key {
  id: UUIDString;
  __typename?: 'Budget_Key';
}

export interface Category_Key {
  id: UUIDString;
  __typename?: 'Category_Key';
}

export interface CreateCategoryForUserData {
  category_insert: Category_Key;
}

export interface CreateCategoryForUserVariables {
  name: string;
  type: string;
  description?: string | null;
  icon?: string | null;
}

export interface GetPublicCategoriesData {
  categories: ({
    id: UUIDString;
    name: string;
    type: string;
    description?: string | null;
    icon?: string | null;
  } & Category_Key)[];
}

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

export interface Transaction_Key {
  id: UUIDString;
  __typename?: 'Transaction_Key';
}

export interface UpdateUserDisplayNameData {
  user_update?: User_Key | null;
}

export interface UpdateUserDisplayNameVariables {
  displayName: string;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface ListUserTransactionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUserTransactionsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListUserTransactionsData, undefined>;
  operationName: string;
}
export const listUserTransactionsRef: ListUserTransactionsRef;

export function listUserTransactions(): QueryPromise<ListUserTransactionsData, undefined>;
export function listUserTransactions(dc: DataConnect): QueryPromise<ListUserTransactionsData, undefined>;

interface CreateCategoryForUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCategoryForUserVariables): MutationRef<CreateCategoryForUserData, CreateCategoryForUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCategoryForUserVariables): MutationRef<CreateCategoryForUserData, CreateCategoryForUserVariables>;
  operationName: string;
}
export const createCategoryForUserRef: CreateCategoryForUserRef;

export function createCategoryForUser(vars: CreateCategoryForUserVariables): MutationPromise<CreateCategoryForUserData, CreateCategoryForUserVariables>;
export function createCategoryForUser(dc: DataConnect, vars: CreateCategoryForUserVariables): MutationPromise<CreateCategoryForUserData, CreateCategoryForUserVariables>;

interface UpdateUserDisplayNameRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateUserDisplayNameVariables): MutationRef<UpdateUserDisplayNameData, UpdateUserDisplayNameVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateUserDisplayNameVariables): MutationRef<UpdateUserDisplayNameData, UpdateUserDisplayNameVariables>;
  operationName: string;
}
export const updateUserDisplayNameRef: UpdateUserDisplayNameRef;

export function updateUserDisplayName(vars: UpdateUserDisplayNameVariables): MutationPromise<UpdateUserDisplayNameData, UpdateUserDisplayNameVariables>;
export function updateUserDisplayName(dc: DataConnect, vars: UpdateUserDisplayNameVariables): MutationPromise<UpdateUserDisplayNameData, UpdateUserDisplayNameVariables>;

interface GetPublicCategoriesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPublicCategoriesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetPublicCategoriesData, undefined>;
  operationName: string;
}
export const getPublicCategoriesRef: GetPublicCategoriesRef;

export function getPublicCategories(): QueryPromise<GetPublicCategoriesData, undefined>;
export function getPublicCategories(dc: DataConnect): QueryPromise<GetPublicCategoriesData, undefined>;

