'use client'

import { Button, Cell, Section } from '@telegram-apps/telegram-ui'

export default function Home() {
  const handleClick = () => {
    alert('Button clicked from Telegram Mini App!')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">Welcome to Trade Mini App</h1>
        <p className="text-lg mb-8 text-center">
          This is a basic Telegram Mini App built with Next.js and Telegram UI.
        </p>
        
        <Section header="Telegram UI Components Demo">
          <Cell
            description="This is a description for the cell"
            subtitle="Subtitle text"
          >
            Example Cell
          </Cell>
          
          <div className="mt-4 flex flex-col gap-4">
            <Button
              size="l"
              stretched
              onClick={handleClick}
            >
              Primary Button
            </Button>
            
            <Button
              size="l"
              stretched
              mode="outline"
              onClick={handleClick}
            >
              Outline Button
            </Button>
            
            <Button
              size="l"
              stretched
              mode="bezeled"
              onClick={handleClick}
            >
              Bezeled Button
            </Button>
          </div>
        </Section>
        
        <div className="mt-8 text-center text-gray-500">
          <p>Start developing your Telegram Mini App here!</p>
        </div>
      </div>
    </main>
  )
}