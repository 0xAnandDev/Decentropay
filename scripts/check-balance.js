const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    if (!deployer) {
        console.error("No deployer found. Please check your PRIVATE_KEY in .env");
        return;
    }
    const address = await deployer.getAddress();
    console.log("Deployer address:", address);
    
    const provider = ethers.provider;
    const balance = await provider.getBalance(address);
    console.log("Deployer balance on Amoy:", ethers.formatEther(balance), "POL");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
