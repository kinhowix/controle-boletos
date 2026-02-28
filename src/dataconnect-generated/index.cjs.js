const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'controle-boletos',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const listUserTransactionsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListUserTransactions');
}
listUserTransactionsRef.operationName = 'ListUserTransactions';
exports.listUserTransactionsRef = listUserTransactionsRef;

exports.listUserTransactions = function listUserTransactions(dc) {
  return executeQuery(listUserTransactionsRef(dc));
};

const createCategoryForUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateCategoryForUser', inputVars);
}
createCategoryForUserRef.operationName = 'CreateCategoryForUser';
exports.createCategoryForUserRef = createCategoryForUserRef;

exports.createCategoryForUser = function createCategoryForUser(dcOrVars, vars) {
  return executeMutation(createCategoryForUserRef(dcOrVars, vars));
};

const updateUserDisplayNameRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateUserDisplayName', inputVars);
}
updateUserDisplayNameRef.operationName = 'UpdateUserDisplayName';
exports.updateUserDisplayNameRef = updateUserDisplayNameRef;

exports.updateUserDisplayName = function updateUserDisplayName(dcOrVars, vars) {
  return executeMutation(updateUserDisplayNameRef(dcOrVars, vars));
};

const getPublicCategoriesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPublicCategories');
}
getPublicCategoriesRef.operationName = 'GetPublicCategories';
exports.getPublicCategoriesRef = getPublicCategoriesRef;

exports.getPublicCategories = function getPublicCategories(dc) {
  return executeQuery(getPublicCategoriesRef(dc));
};
