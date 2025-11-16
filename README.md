# 🔐 Rootstock Attestation Service (RAS) - Tutorial DApp

> **Build a decentralized reputation system using attestations on Rootstock**

---

## 📖 What is RAS?

**Rootstock Attestation Service (RAS)** is a decentralized attestation framework that enables verifiable credentials on the Rootstock blockchain. It allows you to create, issue, and verify on-chain attestations secured by Bitcoin's mining power.

### Key Features:
- ✅ **Bitcoin-Secured** - Leverage Bitcoin's security through Rootstock
- 🔗 **EVM-Compatible** - Use familiar Web3 tools and libraries
- 🌐 **GraphQL API** - Efficient querying through RAS Indexer
- 📜 **Schema Registry** - Define custom attestation structures
- 🔍 **Verifiable On-Chain** - Transparent and tamper-proof credentials

---

## 🎯 Tutorial Overview

This tutorial demonstrates how to build a **loan reputation system** using RAS attestations. Users can:

1. **Issue Attestations** - Lenders create verifiable loan repayment records
2. **Verify Credentials** - Anyone can validate attestation authenticity
3. **Calculate Reputation** - Build credit scores from attestation history

---

## 🏗️ Architecture

### Frontend Layer
- **Next.js + TypeScript** - Modern React framework
- **Ethers.js** - Blockchain interaction library
- **Schema Component** - Define attestation structures
- **Issue Component** - Create and submit attestations
- **Verify Component** - Query and validate attestations

### Blockchain Layer
- **Schema Registry Contract** - Stores attestation schemas on-chain
- **Direct Contract Calls** - Register schemas and issue attestations

---

## 🚀 What You'll Learn

### Smart Contract Interaction
- Register custom attestation schemas
- Issue attestations with encoded data
- Query attestations by recipient or schema
- Verify attestation authenticity on-chain

### RAS Indexer Integration
- Filter attestations by criteria
- Decode attestation data
- Build reputation scoring logic

### Frontend Development
- Connect wallets to RSK Testnet
- Encode data with SchemaEncoder
- Display attestation history
- Create interactive verification tools

---

## 🔧 Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Blockchain | Rootstock Testnet (Chain ID: 31) |
| Web3 Library | Ethers.js v6 |
| Smart Contracts | Solidity 0.8.19 |
| Indexer |
| Deployment | Hardhat |

---

## 📚 Resources

### Official Documentation
- **RAS Documentation**: [dev.rootstock.io/dev-tools/attestations/ras](https://dev.rootstock.io/dev-tools/attestations/ras/)
- **Rootstock Docs**: [dev.rootstock.io](https://dev.rootstock.io)
- **RAS Indexer**: [ras.indexer.rootstock.io/graphql](https://ras.indexer.rootstock.io/graphql)

### Testnet Information
- **Network**: RSK Testnet
- **Chain ID**: 31
- **RPC URL**: `https://public-node.testnet.rsk.co`
- **Explorer**: [explorer.testnet.rsk.co](https://explorer.testnet.rsk.co)
- **Faucet**: Get test RBTC from RSK faucet

### Schema Registry Contract
```
Address: 0x579c62355cD28014BaBF90e9BD430618859eea8205
```

---

## 🎓 Tutorial Steps

### 1️⃣ Setup Environment
- Install dependencies (Next.js, Ethers.js, Hardhat)
- Configure RSK Testnet connection
- Get test RBTC from faucet

### 2️⃣ Define Schema
- Design attestation data structure
- Register schema on Schema Registry
- Get schema UID for future reference

### 3️⃣ Issue Attestations
- Connect wallet to RSK Testnet
- Encode attestation data
- Submit transaction to blockchain

### 4️⃣ Verify Attestations
- Decode attestation data
- Display verification results

### 5️⃣ Build Reputation Logic
- Aggregate user attestations
- Calculate reputation score
- Display credit rating (0-1000)

---

## 💡 Use Cases

### Financial Services
- Undercollateralized lending based on reputation
- Credit scoring for DeFi protocols
- Loan default tracking

### Identity & Credentials
- Educational certificates
- Employment verification
- Professional licenses

### Business & Commerce
- Supplier ratings
- Contract fulfillment records
- Customer reviews

---

## 🌟 Why Rootstock?

### Bitcoin Security
Rootstock is merge-mined with Bitcoin, providing the highest level of blockchain security while enabling smart contracts.

### Low Costs
Transaction fees are significantly lower than Ethereum mainnet, making attestations economical at scale.

### EVM Compatibility
Use all existing Ethereum tools, libraries, and knowledge - no need to learn new paradigms.

### Growing Ecosystem
Active developer community and extensive documentation for building production-ready dApps.

---

## 🤝 Community & Support

- **Discord**: Join the Rootstock developer community
- **GitHub**: Contribute to RAS development
- **Forum**: Ask questions and share projects
- **Twitter**: Follow @rootstock_io for updates

---

## 📝 Next Steps

After completing this tutorial, you can:

- 🎨 **Customize schemas** for your specific use case
- 🔗 **Integrate with other protocols** (DeFi, NFTs, DAOs)
- 🚀 **Deploy to mainnet** for production use
- 🏗️ **Build composable systems** using multiple attestations
- 📊 **Create analytics dashboards** with RAS Indexer data

---

## ⚠️ Important Notes

- This is a **testnet tutorial** - do not use private keys with real funds
- Always verify attestations before making critical decisions
- Test thoroughly before deploying to mainnet
- Follow security best practices for production deployments

---

## 📄 License

This tutorial is open-source and available for educational purposes.

---

**Built with ❤️ for the Rootstock community**

*Secured by Bitcoin. Powered by Smart Contracts.*
