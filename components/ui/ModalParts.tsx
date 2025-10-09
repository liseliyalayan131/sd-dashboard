'use client'

interface ModalBodyProps {
  children: React.ReactNode
  className?: string
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}

interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`sticky bottom-0 p-6 border-t border-white/10 bg-[#111118]/95 backdrop-blur-xl flex gap-3 ${className}`}>
      {children}
    </div>
  )
}
