const { transcode } = require("buffer");
const hre = require("hardhat");
const { ethers } = hre

const tokens = (n) => ethers.parseEther(n.toString());

async function main() {
  // setup accounts
  [buyer, seller, inspector, lender] = await ethers.getSigners();

  // Deploy Real Estate
  const RealEstate = await ethers.getContractFactory("RealEstate");
  const realEstate = await RealEstate.deploy();
  await realEstate.waitForDeployment();
  const realEstateAddress = await realEstate.getAddress()
  console.log(`Deployed real estate contract at: ${realEstateAddress}`);

  console.log(`Minting three properties...\n`);
  for (let i = 0; i < 3; i++) {
    // Approve properties
    const transaction = await realEstate
      .connect(seller)
      .mint(
        `https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${
          i + 1
        }.json`
      );
    await transaction.wait();
  }

  // Deploy Escrow
  const Escrow = await ethers.getContractFactory("Escrow")
  const escrow = await Escrow.deploy(
    realEstateAddress,
    seller.address,
    inspector.address,
    lender.address
  )
  await escrow.waitForDeployment()

  for(let i = 0; i < 3; i++){
    // Approve properties
    const escrowAddress = await escrow.getAddress()
    let transaction = await realEstate.connect(seller).approve(escrowAddress, i + 1)
    await transaction.wait()
  }

  // Listing properties
  transaction = await escrow.connect(seller).list(1, buyer.address, tokens(20), tokens(10))
  await transaction.wait()

  transaction = await escrow.connect(seller).list(2, buyer.address, tokens(20), tokens(15))
  await transaction.wait()

  transaction = await escrow.connect(seller).list(3, buyer.address, tokens(10), tokens(5))
  await transaction.wait()

  console.log(`Finished.`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
