import { ethers, network } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  const isArc      = network.name === 'arc'

  console.log(`\nDeploying to: ${network.name} (chain ${network.config.chainId})`)
  console.log('Deployer:    ', deployer.address)

  const balance = await deployer.provider.getBalance(deployer.address)
  const sym     = isArc ? 'USDC' : 'ETH'
  console.log(`Balance:      ${ethers.formatEther(balance)} ${sym}`)

  if (balance === 0n) {
    const msg = isArc
      ? 'Wallet has 0 USDC. Get testnet USDC from https://faucet.circle.com'
      : 'Wallet has 0 ETH. Fund it with testnet ETH first.'
    throw new Error(msg)
  }

  const arbitrator = deployer.address
  const feeBps     = 100 // 1%

  console.log('\nDeploying EscrowMarket…')
  const EscrowMarket = await ethers.getContractFactory('EscrowMarket')
  const contract     = await EscrowMarket.deploy(arbitrator, feeBps)
  await contract.waitForDeployment()

  const address = await contract.getAddress()

  console.log('\n✅ EscrowMarket deployed!')
  console.log('   Address:     ', address)
  console.log('   Arbitrator:  ', arbitrator)
  console.log('   Fee:          1%')
  if (isArc) {
    console.log(`   Explorer:     https://testnet.arcscan.app/address/${address}`)
  }

  console.log('\n─── Add to .env.local ───────────────────────────────')
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`)
  if (isArc) {
    console.log(`NEXT_PUBLIC_DEFAULT_CHAIN_ID=5042002`)
  }
  console.log('─────────────────────────────────────────────────────\n')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
