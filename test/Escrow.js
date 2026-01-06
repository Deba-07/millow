const { executionAsyncResource } = require("async_hooks");
const { transcode } = require("buffer");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), "ether");
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

    // console.log("RealEstate deployed to: ", address);
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

    // console.log("Escrow deployed to: ", await escrow.getAddress());

    // Approve Property
    transaction = await realEstate
      .connect(seller)
      .approve(await escrow.getAddress(), 1);
    await transaction.wait();

    // List Property
    transaction = await escrow
      .connect(seller)
      .list(1, buyer.address, tokens(10), tokens(5));
    await transaction.wait();
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
      const result = await escrow.isListed(1);
      expect(result).to.be.equal(true);
    });

    it("Updates the ownership", async () => {
      const escrowAddress = await escrow.getAddress();
      expect(await realEstate.ownerOf(1)).to.be.equal(escrowAddress);
    });

    it("Returns the buyer", async () => {
      const result = await escrow.buyer(1);
      expect(result).to.be.equal(buyer.address);
    });

    it("Returns the purchase price", async () => {
      const result = await escrow.purchasePrice(1);
      expect(result).to.be.equal(tokens(10));
    });

    it("Returns the escrow amount", async () => {
      const result = await escrow.escrowAmount(1);
      expect(result).to.be.equal(tokens(5));
    });
  });

  describe("Deposits", () => {
    it("Updates contarct balance", async () => {
      const transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) });
      await transaction.wait();
      const result = await escrow.getBalance();
      expect(result).to.be.equal(tokens(5));
    });
  });

  describe("Inspection", () => {
    it("Updates the inspection status", async () => {
      const transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await transaction.wait();
      const result = await escrow.inspectionPassed(1);
      expect(result).to.be.equal(true);
    });
  });

  describe("Approval", () => {
    it("Updates the approval status", async () => {
      let transaction = await escrow.connect(buyer).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(seller).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(lender).approveSale(1);
      await transaction.wait();

      expect(await escrow.approval(1, buyer.address)).to.be.equal(true);
      expect(await escrow.approval(1, seller.address)).to.be.equal(true);
      expect(await escrow.approval(1, lender.address)).to.be.equal(true);
    });
  });

  describe("Cancel sale", () => {
    it("Refunds buyer if insepection fails", async () => {
      // Buyer deposits earnest
      let transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) })
      await transaction.wait()

      // Ensure inspection is false (default)
      expect(await escrow.inspectionPassed(1)).to.equal(false)
      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address)
      transaction = await escrow.connect(buyer).cancelSell(1)
      await transaction.wait()
      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address)

      // Buyer refunded
      expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore)

      // Escrow emptied
      expect(await escrow.getBalance()).to.equal(0)
    })

    it("Pays seller if inspection passed", async () => {
      // Buyer deposits earnest
      let transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) })
      await transaction.wait()

      // Inspector passes inspection
      transaction = await escrow.connect(inspector).updateInspectionStatus(1, true)
      await transaction.wait()

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address)

      transaction = await escrow.connect(buyer).cancelSell(1)
      await transaction.wait()

      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address)

      // seller paid
      expect(sellerBalanceAfter).to.be.gt(sellerBalanceBefore)

      // Escrow emptied
      expect(await escrow.getBalance()).to.equal(0)
    })
  })

  describe("Sale", async () => {
    beforeEach(async () => {
      let transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) });
      await transaction.wait();

      transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await transaction.wait();

      transaction = await escrow.connect(buyer).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(seller).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(lender).approveSale(1);
      await transaction.wait();

      await lender.sendTransaction({
        to: await escrow.getAddress(),
        value: tokens(5),
      });

      transaction = await escrow.connect(seller).finalizeSale(1);
      await transaction.wait();
    });

    it("Updates the ownership", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address)
    })

    it("Updates balance", async () => {
      expect(await escrow.getBalance()).to.be.equal(0);
    });
  });
});
