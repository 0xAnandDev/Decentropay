const { ethers } = require("hardhat");

async function main() {
    const PaymentGateway = await ethers.getContractFactory("PaymentGateway");

    const paymentGateway = await PaymentGateway.deploy();

    await paymentGateway.waitForDeployment();

    console.log("Contract deployed to:", await paymentGateway.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});