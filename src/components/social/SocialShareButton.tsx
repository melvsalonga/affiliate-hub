'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SocialShareModal } from './SocialShareModal'
import { ShareIcon } from '@heroicons/react/24/outline'

interface SocialShareButtonProps {
  type: 'product' | 'deal'
  itemId: string
  item: any
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function SocialShareButton({
  type,
  itemId,
  item,
  variant = 'outline',
  size = 'sm',
  showText = true,
  className = '',
}: SocialShareButtonProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowModal(true)}
        className={`flex items-center space-x-2 ${className}`}
      >
        <ShareIcon className="h-4 w-4" />
        {showText && <span>Share</span>}
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Share ${type === 'product' ? 'Product' : 'Deal'}`}
        size="md"
      >
        <SocialShareModal
          type={type}
          itemId={itemId}
          item={item}
          onClose={() => setShowModal(false)}
        />
      </Modal>
    </>
  )
}