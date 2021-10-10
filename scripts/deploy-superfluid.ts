// Deploy Superfluid supporting resources on Rinkeby testnet.

import { ethers, waffle, network } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();

  // deploy cortex

  const Cortex = await ethers.getContractFactory("Cortex");
  const cortex = await Cortex.deploy(
    "0xb6eeCEA4F27855c368412d23A80688d034A5cA5D", // oracle
    "0xeD5B5b32110c3Ded02a07c8b8e97513FAfb883B6", // host
    "0x745861AeD1EEe363b4AaA5F1994Be40b1e05Ff90", // acceptedSuperToken (fDAIx)
    "0x32E0ecb72C1dDD92B007405F8102c1556624264D", // ida
    "1000000000000000000" // purchasePrice (1 fDAIx)
  );
  await cortex.deployed();
  console.log(`Cortex at ${cortex.address}`);

  // approve fDAIx to cortex
  const superToken = await ethers.getContractAt(
    "ISuperToken",
    "0x745861AeD1EEe363b4AaA5F1994Be40b1e05Ff90"
  );
  await superToken.approve(
    cortex.address,
    "115792089237316195423570985008687907853269984665640564039457584007913129639935"
  ); // infinite allowance

  // poke subscription
  const ida = await ethers.getContractAt(
    "IInstantDistributionAgreementV1",
    "0x32E0ecb72C1dDD92B007405F8102c1556624264D"
  );
  await cortex.poke([0], [await owner.getAddress()]);
  let subscription = await ida.getSubscription(
    "0x745861AeD1EEe363b4AaA5F1994Be40b1e05Ff90",
    cortex.address,
    1,
    ownerAddress
  );
  console.log(
    subscription.units.toString(),
    subscription.pendingDistribution.toString()
  );

  // purchase
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0x07158265D3fA6EC45085BA452F9D25E85319d155"],
  });

  await cortex.purchase();

  await network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: ["0x07158265D3fA6EC45085BA452F9D25E85319d155"],
  });

  subscription = await ida.getSubscription(
    "0x745861AeD1EEe363b4AaA5F1994Be40b1e05Ff90",
    cortex.address,
    1,
    ownerAddress
  );
  console.log(
    subscription.units.toString(),
    subscription.pendingDistribution.toString()
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
