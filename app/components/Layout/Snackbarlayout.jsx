'use client'

import { SnackbarProvider } from '@/context/SnackbarContext'

export default function RootLayout({ children }) {
  return (
    <SnackbarProvider position="bottom-right">
      {children}
    </SnackbarProvider>
  )
}