import React from 'react'
import ClientHome from '../components/ClientHome'

export default function Page() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-center">Welcome to Trade Mini App</h1>
      <p className="text-center text-sm mt-2">Your portfolio and token management</p>
      {/* ClientHome is a client component that handles token input and portfolio rendering */}
      <ClientHome />
    </main>
  )
}
