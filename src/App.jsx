import React, { useEffect, useState } from 'react'
import { BrowserProvider } from 'ethers'

const App = () => {
  const [ account, setAccount ] = useState(null)

  const loadBlockchainData = async () => {
    const provider = new BrowserProvider(window.ethereum)
    console.log(provider)
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    setAccount(accounts[0])
    console.log(accounts[0])
  }

  useEffect(() => {
    loadBlockchainData()
  }, [])
  return (
    <div className='text-3xl text-black font-bold text-center'>App</div>
  )
}

export default App