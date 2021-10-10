// imports
import { expect } from "chai";
import { ethers, waffle } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { OOFFactory, OpenOracleFramework } from "../typechain";

// test suite for ConjureFactory
describe("OOF Basic Tests", function () {
  let owner: SignerWithAddress;
  let notOwner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let oofFactory: OOFFactory;
  let oof: OpenOracleFramework;

  // initial deployment of Conjure Factory
  before(async function () {
    [owner, notOwner, addr1, addr2, addr3] = await ethers.getSigners();

    const OpenOracleFramework = await ethers.getContractFactory(
      "OpenOracleFramework"
    );
    const openOracleFramework = await OpenOracleFramework.deploy();

    // deploy router
    const Router = await ethers.getContractFactory("ConjureRouter");
    const router = await Router.deploy(owner.address, owner.address);

    const OOFFactory = await ethers.getContractFactory("OOFFactory");
    oofFactory = await OOFFactory.deploy(
      openOracleFramework.address,
      router.address
    );

    const tx = await oofFactory.oofMint(
      [owner.address],
      1,
      owner.address,
      "1000000000000000000"
    );

    const { events } = await tx.wait();
    const [event] = events!.filter((e: any) => e.event === "NewOOF");
    oof = await ethers.getContractAt("OpenOracleFramework", event.args!.oof);
  });

  // basic mints
  it("Check if all values of the OOF contract have been deployed and set right", async function () {
    const signerThreshold = await oof.signerThreshold();
    const signers = await oof.signers(0);
    const signerLength = await oof.signerLength();
    const payoutAddress = await oof.payoutAddress();
    const subscriptionPassPrice = await oof.subscriptionPassPrice();

    expect(signerThreshold).to.equal("1");
    expect(signers).to.equal(owner.address);
    expect(signerLength).to.equal("1");
    expect(payoutAddress).to.equal(owner.address);
    expect(subscriptionPassPrice).to.equal("1000000000000000000");
  });

  it("Should revert if submitFeed is called by a non signer address", async function () {
    await expect(oof.connect(notOwner).submitFeed([0], [0])).to.be.revertedWith(
      "Only a signer can perform this action"
    );
  });

  it("Should be able to create a new feed", async function () {
    await oof.createNewFeeds(
      ["feed1", "feed2"],
      ["test1", "test2"],
      [18, 0],
      [3600, 10800],
      ["100000000000000", "100000000000000"],
      [1, 0]
    );

    const feedlist = await oof.getFeedList([0, 1]);

    expect(feedlist[0][0]).to.be.equal("feed1");
  });

  it("Should be able to submit a feed", async function () {
    await oof.submitFeed([0], [100]);

    await oof.submitFeed([1], [500]);
  });

  it("Check feed visibility", async function () {
    // should not be possible
    await expect(oof.connect(addr1).getFeeds([0])).to.be.revertedWith(
      "No subscription to feed"
    );

    // send
    const overrides = {
      value: "1000000000000000000",
    };

    // buy pass
    await oof.connect(addr1).buyPass(addr1.address, 3600, overrides);

    let price = await oof.connect(addr1).getFeeds([0]);
    console.log(price);
    expect(price[0][0]).to.be.equal(100);

    await expect(oof.connect(addr2).getFeeds([0])).to.be.revertedWith(
      "No subscription to feed"
    );

    const pricFree = await oof.connect(addr2).getFeeds([1]);
    console.log(pricFree);
    expect(pricFree[0][0]).to.be.equal(500);

    await expect(oof.connect(addr3).getFeeds([0])).to.be.revertedWith(
      "No subscription to feed"
    );

    await oof
      .connect(addr3)
      .subscribeToFeed([0], [3600], addr3.address, overrides);
    price = await oof.connect(addr1).getFeeds([0]);
    expect(price[0][0]).to.be.equal(100);
  });
});
