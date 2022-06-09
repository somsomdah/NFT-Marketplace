// const ConvertLib = artifacts.require("ConvertLib");
const MetaCoin = artifacts.require("MetaCoin");
const NFT = artifacts.require("NFT");
const Market = artifacts.require("Market");

module.exports = async function (deployer) {
  // await deployer.deploy(ConvertLib);
  // await deployer.link(ConvertLib, MetaCoin);
  await deployer.deploy(MetaCoin);
  await deployer.deploy(NFT);
  await deployer.deploy(Market, (await NFT.deployed()).address, (await MetaCoin.deployed()).address);

};
