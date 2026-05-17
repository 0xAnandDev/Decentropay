const { ethers } = require("hardhat");

async function main() {
    const address = "0xEb81838AF6Bd5677e1Ba211A0761948bE53Fc596";
    console.log("Checking address:", address);
    
    const provider = ethers.provider;
    const code = await provider.getCode(address);
    console.log("Code at address length:", code.length);
    if (code === "0x") {
        console.log("CRITICAL ERROR: No contract is deployed at this address! It is an EOA (empty address).");
    } else {
        console.log("SUCCESS: A contract is deployed at this address.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
