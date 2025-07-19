'use client'

import { useState } from 'react'
import { ContentTemplate, contentTemplates, getTemplatesByType } from '@/lib/content-templates'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { FileText, BarChart3, BookOpen } from 'lucide-react'

interface ContentTemplateSelectorProps {
  onSelectTemplate: (template: ContentTemplate) => void
  isOpen: boolean
  onClose: () => void
}

const templateIcons = {
  review: FileText,
  comparison: BarChart3,
  'buying-guide': BookOpen
}

export function ContentTemplateSelector({ onSelectTemplate, isOpen, onClose }: ContentTemplateSelectorProps) {
  const [selectedType, setSelectedType] = useState<ContentTemplate['type'] | 'all'>('all')

  const filteredTemplates = selectedType === 'all' 
    ? contentTemplates 
    : getTemplatesByType(selectedType)

  const handleSelectTemplate = (template: ContentTemplate) => {
    onSelectTemplate(template)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose Content Template" size="lg">
      <div className="space-y-6">
        {/* Template Type Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedType === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('all')}
          >
            All Templates
          </Button>
          <Button
            variant={selectedType === 'review' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('review')}
          >
            Reviews
          </Button>
          <Button
            variant={selectedType === 'comparison' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('comparison')}
          >
            Comparisons
          </Button>
          <Button
            variant={selectedType === 'buying-guide' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('buying-guide')}
          >
            Buying Guides
          </Button>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => {
            const Icon = templateIcons[template.type]
            return (
              <Card key={template.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500">
                        Sections: {template.structure.length}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.structure.slice(0, 3).map((section) => (
                          <span
                            key={section.id}
                            className="px-2 py-1 bg-gray-100 text-xs rounded"
                          >
                            {section.title}
                          </span>
                        ))}
                        {template.structure.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-xs rounded">
                            +{template.structure.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      className="w-full mt-3"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      Use This Template
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No templates found for the selected type.
          </div>
        )}
      </div>
    </Modal>
  )
}