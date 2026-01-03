# Millow — Real Estate NFT Escrow

Simple example project demonstrating an NFT-based Real Estate escrow using Hardhat, OpenZeppelin, and a minimal Vite React frontend.

--

## Summary

- **Contracts**: Implements an `ERC721` Real Estate token and an `Escrow` contract to list NFTs and hold them in escrow.
- **Tools**: Hardhat for development and testing, OpenZeppelin contracts, and Vite + React for the frontend.

## Key Files

- Contract: [contracts/RealEstate.sol](contracts/RealEstate.sol)
- Contract: [contracts/Escrow.sol](contracts/Escrow.sol)
- Tests: [test/Escrow.js](test/Escrow.js)
- Frontend entry: [src/App.jsx](src/App.jsx)

## Requirements

- Node.js (16+ recommended)
- npm or yarn

## Setup

1. Install dependencies

```bash
npm install
```

2. Compile contracts

```bash
npx hardhat compile
```

3. Run tests

```bash
npx hardhat test
```

4. Run the frontend (optional)

```bash
npm run dev
```

## What the code does

- `RealEstate.sol` is an `ERC721URIStorage` token that allows anyone to mint a new property NFT via `mint(string memory tokenURI)` and exposes `totalSupply()`.
- `Escrow.sol` accepts an NFT transfer to the contract via `list(uint256 _nftID)` and marks it as listed. The Escrow contract constructor accepts the NFT address, seller, inspector, and lender addresses.

## Tests

The test suite (see [test/Escrow.js](test/Escrow.js)):

- Deploys `RealEstate` and mints a token for `seller`.
- Deploys `Escrow` with the `RealEstate` address plus `seller`, `inspector`, and `lender` accounts.
- Approves and lists the property, then asserts the NFT ownership transfers to the `Escrow` contract and listing state updates.

## Notes

- This is an example / learning project and should not be used as-is in production. Important escrow flows (deposit handling, inspections, approvals, cancellations, and security checks) are not implemented here and would be required for a production system.
