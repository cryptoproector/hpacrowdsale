const HPACrowdsale = artifacts.require("HPACrowdsale");
const hpaCoin = artifacts.require("HighlyProfitableAnonymousToken");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(HPACrowdsale, 
    {gas: 67219750, from: accounts[0]}
  );
};
