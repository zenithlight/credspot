// Deploy Oracle using Conjure.finance OOF on Rinkeby testnet.
// (Supporting contracts for local testnet are commented out.)

import { ethers, waffle } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  //
  // const OpenOracleFramework = await ethers.getContractFactory(
  //   "OpenOracleFramework"
  // );
  // const openOracleFramework = await OpenOracleFramework.deploy();
  // await openOracleFramework.deployed();
  //
  // console.log(
  //   "Oracle implementation deployed to:",
  //   openOracleFramework.address
  // );
  //
  // const Router = await ethers.getContractFactory("ConjureRouter");
  // const router = await Router.deploy(owner.address, owner.address);
  // await router.deployed();
  //
  // console.log("Router deployed to:", router.address);
  //
  // const OOFFactory = await ethers.getContractFactory("OOFFactory");
  // const oofFactory = await OOFFactory.deploy(
  //   openOracleFramework.address,
  //   router.address
  // );
  // await oofFactory.deployed();

  const oofFactory = await ethers.getContractAt(
    "OOFFactory",
    process.env.OPEN_ORACLE_FRAMEWORK_FACTORY!
  );
  console.log("Oracle factory at:", oofFactory.address);

  const mintTx = await oofFactory.oofMint(
    [owner.address],
    1,
    owner.address,
    ethers.utils.parseEther("1")
  );

  const { events } = await mintTx.wait();
  const [event] = events!.filter((e: any) => e.event === "NewOOF");
  const oracle = await ethers.getContractAt(
    "OpenOracleFramework",
    event.args!.oof
  );

  console.log("Oracle deployed to:", oracle.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
