const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Escrow", () => {
  let buyer, seller, inspector, lender;
  let realEstate, escrow;
  beforeEach(async () => {
    // setup accounts
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    // Log the addresses of the accounts
    // console.log("Buyer address:", buyer.address);
    // console.log("Seller address:", seller.address);
    // console.log("Inspector address:", inspector.address);
    // console.log("Lender address:", lender.address);

    // Deploy RealEstate
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();

    await realEstate.waitForDeployment();
    const address = await realEstate.getAddress();

    console.log("RealEstate deployed to: ", address);
    expect(address).to.not.equal(null);

    // Mint
    let transaction = await realEstate
      .connect(seller)
      .mint(
        "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS"
      );
    await transaction.wait();

    const Escrow = await ethers.getContractFactory("Escrow");

    // Log the addresses being passed to the Escrow constructor
    // console.log("Deploying Escrow with following addresses:");
    // console.log("RealEstate address:", await realEstate.getAddress());
    // console.log("Seller address:", seller.address);
    // console.log("Inspector address:", inspector.address);
    // console.log("Lender address:", lender.address);

    escrow = await Escrow.deploy(
      await realEstate.getAddress(),
      seller.address,
      inspector.address,
      lender.address
    );
    await escrow.waitForDeployment();

    console.log("Escrow deployed to: ", await escrow.getAddress());

    // Approve Property
    transaction = await realEstate
    .connect(seller)
    .approve(await escrow.getAddress(), 1)
    await transaction.wait()

    // List Property
    transaction = await escrow.connect(seller).list(1)
    await transaction.wait()
  });

  describe("Deployment", () => {
    it("Returns NFT address", async () => {
      const result = await escrow.nftAddress();
      const realEstateAddress = await realEstate.getAddress();
      expect(result).to.be.equal(realEstateAddress);
    });

    it("Returns Seller", async () => {
      const result = await escrow.seller();
      const sellerAddress = await seller.getAddress();
      expect(result).to.be.equal(sellerAddress);
    });

    it("Returns Inspector", async () => {
      const result = await escrow.inspector();
      const inspectorAddress = await inspector.getAddress();
      expect(result).to.be.equal(inspectorAddress);
    });

    it("Returns Lender", async () => {
      const result = await escrow.lender();
      const lenderAddress = await lender.getAddress();
      expect(result).to.be.equal(lenderAddress);
    });
  });

  describe("Listing", () => {
    it("Updates as listed", async () => {
      const result = await escrow.isListed(1)
      expect(result).to.be.equal(true)
    })
    it("Updates the ownership", async () => {
      const escrowAddress = await escrow.getAddress();
      expect(await realEstate.ownerOf(1)).to.be.equal(escrowAddress);
    });
  });
});
