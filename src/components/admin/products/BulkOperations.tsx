'use client';

import React, { useState } from 'react';
import { 
  CheckSquare,
  Square,
  Trash2,
  Archive,
  Eye,
  EyeOff,
  Download,
  Copy,
  Tag,
  FolderTree,
  AlertTriangle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Form';
import { ProductWithRelations, Category, Tag as TagType } from '@/types/database';
import { ProductStatus } from '@prisma/client';

interface BulkOperationsProps {
  products: ProductWithRelations[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onBulkAction: (action: BulkAction, options?: any) => Promise<void>;
  categories: Category[];
  tags: TagType[];
}

export interface BulkAction {
  type: 'delete' | 'activate' | 'deactivate' | 'archive' | 'changeCategory' | 'addTags' | 'removeTags' | 'changeStatus' | 'export' | 'duplicate';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'danger' | 'warning';
  requiresConfirmation?: boolean;
  requiresOptions?: boolean;
}

const bulkActions: BulkAction[] = [
  {
    type: 'activate',
    label: 'Activate Products',
    icon: Eye,
    variant: 'default'
  },
  {
    type: 'deactivate',
    label: 'Deactivate Products',
    icon: EyeOff,
    variant: 'warning'
  },
  {
    type: 'changeStatus',
    label: 'Change Status',
    icon: Tag,
    variant: 'default',
    requiresOptions: true
  },
  {
    type: 'changeCategory',
    label: 'Change Category',
    icon: FolderTree,
    variant: 'default',
    requiresOptions: true
  },
  {
    type: 'addTags',
    label: 'Add Tags',
    icon: Tag,
    variant: 'default',
    requiresOptions: true
  },
  {
    type: 'removeTags',
    label: 'Remove Tags',
    icon: Tag,
    variant: 'default',
    requiresOptions: true
  },
  {
    type: 'duplicate',
    label: 'Duplicate Products',
    icon: Copy,
    variant: 'default'
  },
  {
    type: 'export',
    label: 'Export Products',
    icon: Download,
    variant: 'default'
  },
  {
    type: 'archive',
    label: 'Archive Products',
    icon: Archive,
    variant: 'warning',
    requiresConfirmation: true
  },
  {
    type: 'delete',
    label: 'Delete Products',
    icon: Trash2,
    variant: 'danger',
    requiresConfirmation: true
  }
];

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  products,
  selectedIds,
  onSelectionChange,
  onBulkAction,
  categories,
  tags
}) => {
  const [showConfirmation, setShowConfirmation] = useState<BulkAction | null>(null);
  const [showOptions, setShowOptions] = useState<BulkAction | null>(null);
  const [actionOptions, setActionOptions] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const selectedProducts = products.filter(p => selectedIds.includes(p.id));
  const allSelected = products.length > 0 && selectedIds.length === products.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < products.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(products.map(p => p.id));
    }
  };

  const handleBulkAction = async (action: BulkAction) => {
    if (selectedIds.length === 0) return;

    if (action.requiresConfirmation) {
      setShowConfirmation(action);
      return;
    }

    if (action.requiresOptions) {
      setShowOptions(action);
      return;
    }

    await executeBulkAction(action);
  };

  const executeBulkAction = async (action: BulkAction, options?: any) => {
    setLoading(true);
    try {
      await onBulkAction(action, options);
      setShowConfirmation(null);
      setShowOptions(null);
      setActionOptions({});
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderActionOptions = (action: BulkAction) => {
    switch (action.type) {
      case 'changeStatus':
        return (
          <Select
            label="New Status"
            options={[
              { value: ProductStatus.DRAFT, label: 'Draft' },
              { value: ProductStatus.ACTIVE, label: 'Active' },
              { value: ProductStatus.SCHEDULED, label: 'Scheduled' },
              { value: ProductStatus.INACTIVE, label: 'Inactive' }
            ]}
            value={actionOptions.status || ''}
            onChange={(e) => setActionOptions({ ...actionOptions, status: e.target.value })}
            required
          />
        );

      case 'changeCategory':
        return (
          <Select
            label="New Category"
            options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
            value={actionOptions.categoryId || ''}
            onChange={(e) => setActionOptions({ ...actionOptions, categoryId: e.target.value })}
            required
          />
        );

      case 'addTags':
      case 'removeTags':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Tags
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={actionOptions.tagIds?.includes(tag.id) || false}
                    onChange={(e) => {
                      const tagIds = actionOptions.tagIds || [];
                      if (e.target.checked) {
                        setActionOptions({ 
                          ...actionOptions, 
                          tagIds: [...tagIds, tag.id] 
                        });
                      } else {
                        setActionOptions({ 
                          ...actionOptions, 
                          tagIds: tagIds.filter((id: string) => id !== tag.id) 
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{tag.name}</span>
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      <Card className="border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSelectAll}
                className="flex items-center space-x-2"
              >
                {allSelected ? (
                  <CheckSquare className="h-5 w-5 text-primary-600" />
                ) : someSelected ? (
                  <div className="h-5 w-5 bg-primary-600 rounded border-2 border-primary-600 flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-sm" />
                  </div>
                ) : (
                  <Square className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedIds.length} of {products.length} selected
                </span>
              </button>

              <div className="flex items-center space-x-2">
                {bulkActions.slice(0, 4).map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.type}
                      size="sm"
                      variant={action.variant === 'danger' ? 'danger' : action.variant === 'warning' ? 'warning' : 'outline'}
                      onClick={() => handleBulkAction(action)}
                      disabled={loading}
                      icon={<Icon className="h-4 w-4" />}
                    >
                      {action.label}
                    </Button>
                  );
                })}

                {/* More Actions Dropdown */}
                <div className="relative">
                  <Select
                    options={[
                      { value: '', label: 'More actions...' },
                      ...bulkActions.slice(4).map(action => ({
                        value: action.type,
                        label: action.label
                      }))
                    ]}
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        const action = bulkActions.find(a => a.type === e.target.value);
                        if (action) handleBulkAction(action);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange([])}
              icon={<X className="h-4 w-4" />}
            >
              Clear Selection
            </Button>
          </div>

          {/* Selected Products Preview */}
          {selectedIds.length <= 5 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedProducts.map((product) => (
                <Badge
                  key={product.id}
                  variant="outline"
                  className="flex items-center space-x-1"
                >
                  <span className="truncate max-w-32">{product.title}</span>
                  <button
                    onClick={() => onSelectionChange(selectedIds.filter(id => id !== product.id))}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span>Confirm Action</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to {showConfirmation.label.toLowerCase()} {selectedIds.length} product(s)?
                {showConfirmation.type === 'delete' && (
                  <span className="block mt-2 text-red-600 dark:text-red-400 font-medium">
                    This action cannot be undone.
                  </span>
                )}
              </p>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(null)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant={showConfirmation.variant === 'danger' ? 'danger' : 'primary'}
                  onClick={() => executeBulkAction(showConfirmation)}
                  loading={loading}
                >
                  {showConfirmation.label}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Options Modal */}
      {showOptions && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{showOptions.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This action will be applied to {selectedIds.length} selected product(s).
              </p>

              {renderActionOptions(showOptions)}

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowOptions(null);
                    setActionOptions({});
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => executeBulkAction(showOptions, actionOptions)}
                  loading={loading}
                  disabled={
                    (showOptions.type === 'changeStatus' && !actionOptions.status) ||
                    (showOptions.type === 'changeCategory' && !actionOptions.categoryId) ||
                    ((showOptions.type === 'addTags' || showOptions.type === 'removeTags') && 
                     (!actionOptions.tagIds || actionOptions.tagIds.length === 0))
                  }
                >
                  Apply Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};