import React from 'react'
import ClientHome from '../components/ClientHome'

export default function Page() {
  return (
    <main>
      {/* ClientHome is a client component that safely reads localStorage */}
      <ClientHome />
    </main>
  )
}
