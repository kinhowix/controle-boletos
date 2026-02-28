import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'controle-boletos',
  location: 'us-east4'
};

export const listUserTransactionsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListUserTransactions');
}
listUserTransactionsRef.operationName = 'ListUserTransactions';

export function listUserTransactions(dc) {
  return executeQuery(listUserTransactionsRef(dc));
}

export const createCategoryForUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateCategoryForUser', inputVars);
}
createCategoryForUserRef.operationName = 'CreateCategoryForUser';

export function createCategoryForUser(dcOrVars, vars) {
  return executeMutation(createCategoryForUserRef(dcOrVars, vars));
}

export const updateUserDisplayNameRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateUserDisplayName', inputVars);
}
updateUserDisplayNameRef.operationName = 'UpdateUserDisplayName';

export function updateUserDisplayName(dcOrVars, vars) {
  return executeMutation(updateUserDisplayNameRef(dcOrVars, vars));
}

export const getPublicCategoriesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPublicCategories');
}
getPublicCategoriesRef.operationName = 'GetPublicCategories';

export function getPublicCategories(dc) {
  return executeQuery(getPublicCategoriesRef(dc));
}

