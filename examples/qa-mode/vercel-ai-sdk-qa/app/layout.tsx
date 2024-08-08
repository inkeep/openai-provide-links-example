interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={'font-sans antialiased'}>
        <div className="flex flex-col min-h-screen">
          <main className="flex flex-col flex-1 bg-muted/50">{children}</main>
        </div>
      </body>
    </html>
  )
}
