import React, { useEffect, useState } from 'react'
import { BrowserProvider, ethers } from 'ethers'
import Navigation from './components/Navigation'
import Search from './components/Search'

const App = () => {
  const [ account, setAccount ] = useState(null)

  const loadBlockchainData = async () => {
    const provider = new BrowserProvider(window.ethereum)
    window.ethereum.on("accountsChanged", async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts'})
      const account = ethers.getAddress(accounts[0])
      setAccount(account)
    })
  }

  useEffect(() => {
    loadBlockchainData()
  }, [])
  return (
    <div>
      <Navigation account={account} setAccount={setAccount}/>
      <Search />
    </div>
  )
}

export default App