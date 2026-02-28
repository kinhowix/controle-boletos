import { ListUserTransactionsData, CreateCategoryForUserData, CreateCategoryForUserVariables, UpdateUserDisplayNameData, UpdateUserDisplayNameVariables, GetPublicCategoriesData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useListUserTransactions(options?: useDataConnectQueryOptions<ListUserTransactionsData>): UseDataConnectQueryResult<ListUserTransactionsData, undefined>;
export function useListUserTransactions(dc: DataConnect, options?: useDataConnectQueryOptions<ListUserTransactionsData>): UseDataConnectQueryResult<ListUserTransactionsData, undefined>;

export function useCreateCategoryForUser(options?: useDataConnectMutationOptions<CreateCategoryForUserData, FirebaseError, CreateCategoryForUserVariables>): UseDataConnectMutationResult<CreateCategoryForUserData, CreateCategoryForUserVariables>;
export function useCreateCategoryForUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateCategoryForUserData, FirebaseError, CreateCategoryForUserVariables>): UseDataConnectMutationResult<CreateCategoryForUserData, CreateCategoryForUserVariables>;

export function useUpdateUserDisplayName(options?: useDataConnectMutationOptions<UpdateUserDisplayNameData, FirebaseError, UpdateUserDisplayNameVariables>): UseDataConnectMutationResult<UpdateUserDisplayNameData, UpdateUserDisplayNameVariables>;
export function useUpdateUserDisplayName(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateUserDisplayNameData, FirebaseError, UpdateUserDisplayNameVariables>): UseDataConnectMutationResult<UpdateUserDisplayNameData, UpdateUserDisplayNameVariables>;

export function useGetPublicCategories(options?: useDataConnectQueryOptions<GetPublicCategoriesData>): UseDataConnectQueryResult<GetPublicCategoriesData, undefined>;
export function useGetPublicCategories(dc: DataConnect, options?: useDataConnectQueryOptions<GetPublicCategoriesData>): UseDataConnectQueryResult<GetPublicCategoriesData, undefined>;
