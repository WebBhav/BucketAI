import React, { useState } from 'react';
import { X, Edit2, Split, GitMerge, Check, Search } from 'lucide-react';
import { Bucket, UniqueRemark, RawRow } from '../types';

interface RenameModalProps {
  isOpen: boolean;
  bucket: Bucket | null;
  onClose: () => void;
  onSave: (bucketId: string, newName: string, newDescription: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({ isOpen, bucket, onClose, onSave }) => {
  if (!isOpen || !bucket) return null;

  const [name, setName] = useState(bucket.name);
  const [description, setDescription] = useState(bucket.description);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(bucket.id, name.trim(), description.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 max-w-md w-full p-6 space-y-4 text-zinc-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-rose-500" />
            Rename Bucket & Description
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Bucket Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Description / Business Theme
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg cursor-pointer shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface MergeModalProps {
  isOpen: boolean;
  buckets: Bucket[];
  initialSelectedBucketId?: string;
  onClose: () => void;
  onMerge: (bucketIds: string[], newCombinedName: string) => void;
}

export const MergeModal: React.FC<MergeModalProps> = ({
  isOpen,
  buckets,
  initialSelectedBucketId,
  onClose,
  onMerge,
}) => {
  if (!isOpen) return null;

  const eligibleBuckets = buckets.filter((b) => !b.isBlankBucket);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialSelectedBucketId ? [initialSelectedBucketId] : []
  );
  const [combinedName, setCombinedName] = useState('');

  const toggleBucket = (id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      if (next.length >= 2 && !combinedName) {
        const names = next
          .map((bid) => eligibleBuckets.find((b) => b.id === bid)?.name)
          .filter(Boolean);
        setCombinedName(names.join(' & '));
      }
      return next;
    });
  };

  const handleMergeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length >= 2 && combinedName.trim()) {
      onMerge(selectedIds, combinedName.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 max-w-lg w-full p-6 space-y-4 text-zinc-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-rose-500" />
            Merge Multiple Buckets
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-400">
          Select two or more buckets to consolidate into a single category. All row assignments will be preserved and mapped to the new bucket.
        </p>

        <form onSubmit={handleMergeSubmit} className="space-y-4">
          <div className="max-h-56 overflow-y-auto space-y-1.5 border border-zinc-800 rounded-lg p-2.5 bg-zinc-950">
            {eligibleBuckets.map((b) => {
              const isSelected = selectedIds.includes(b.id);
              return (
                <div
                  key={b.id}
                  onClick={() => toggleBucket(b.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected ? 'bg-rose-950/40 border border-rose-800/60' : 'hover:bg-zinc-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-zinc-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <div>
                      <span className="font-semibold text-white">{b.name}</span>
                      <span className="text-zinc-400 ml-2 font-mono tabular-nums">
                        ({b.totalRows.toLocaleString()} rows)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              New Combined Bucket Name
            </label>
            <input
              type="text"
              value={combinedName}
              onChange={(e) => setCombinedName(e.target.value)}
              placeholder="e.g. Delivery & Transportation Delays"
              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedIds.length < 2 || !combinedName.trim()}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg cursor-pointer"
            >
              Merge {selectedIds.length} Buckets
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SplitModalProps {
  isOpen: boolean;
  bucket: Bucket | null;
  onClose: () => void;
  onSplit: (bucket: Bucket, k: number) => void;
}

export const SplitModal: React.FC<SplitModalProps> = ({ isOpen, bucket, onClose, onSplit }) => {
  if (!isOpen || !bucket) return null;
  const [splitCount, setSplitCount] = useState<number>(2);

  const handleSplitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSplit(bucket, splitCount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 max-w-md w-full p-6 space-y-4 text-zinc-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Split className="w-4 h-4 text-rose-500" />
            Split Bucket: {bucket.name}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-400">
          Recluster the remarks within this bucket into finer sub-categories using local reclustering.
        </p>

        <form onSubmit={handleSplitSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Number of Sub-Categories to Create
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSplitCount(2)}
                className={`py-2 text-xs font-medium border rounded-lg text-center cursor-pointer ${
                  splitCount === 2 ? 'bg-rose-950/40 border-rose-600 text-rose-300 font-bold' : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                }`}
              >
                Split into 2 Sub-Buckets
              </button>
              <button
                type="button"
                onClick={() => setSplitCount(3)}
                className={`py-2 text-xs font-medium border rounded-lg text-center cursor-pointer ${
                  splitCount === 3 ? 'bg-rose-950/40 border-rose-600 text-rose-300 font-bold' : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                }`}
              >
                Split into 3 Sub-Buckets
              </button>
            </div>
          </div>

          <div className="p-3 bg-zinc-950 rounded-lg text-xs text-zinc-400">
            Current bucket contains <span className="font-bold text-white font-mono tabular-nums">{bucket.totalRows}</span> rows across <span className="font-bold text-white font-mono tabular-nums">{bucket.uniqueRemarkHashes.length}</span> unique remarks.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg cursor-pointer"
            >
              Split Bucket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface InspectBucketDrawerProps {
  isOpen: boolean;
  bucket: Bucket | null;
  uniqueRemarks: UniqueRemark[];
  allRows: RawRow[];
  remarksCol: string;
  primaryKeyCol: string;
  onClose: () => void;
  onMoveRemark: (hash: string, targetBucketId: string) => void;
  allBuckets: Bucket[];
}

export const InspectBucketDrawer: React.FC<InspectBucketDrawerProps> = ({
  isOpen,
  bucket,
  uniqueRemarks,
  allRows,
  remarksCol,
  primaryKeyCol,
  onClose,
  onMoveRemark,
  allBuckets,
}) => {
  if (!isOpen || !bucket) return null;

  const [searchTerm, setSearchTerm] = useState('');

  const bucketRemarks = uniqueRemarks.filter((u) => bucket.uniqueRemarkHashes.includes(u.hash));
  const filteredRemarks = searchTerm
    ? bucketRemarks.filter((u) => u.originalText.toLowerCase().includes(searchTerm.toLowerCase()))
    : bucketRemarks;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-zinc-900 w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-zinc-800 animate-in slide-in-from-right duration-200 text-zinc-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: bucket.color }}
              />
              <h2 className="text-base font-bold text-white">{bucket.name}</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-lg leading-relaxed">
              {bucket.description}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Metadata Bar */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between gap-4 bg-zinc-900">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search remarks in this bucket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
          <div className="text-xs text-zinc-400 whitespace-nowrap font-mono tabular-nums">
            {filteredRemarks.length} unique phrases ({bucket.totalRows.toLocaleString()} rows)
          </div>
        </div>

        {/* Remarks List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-900">
          {filteredRemarks.map((remark) => (
            <div
              key={remark.hash}
              className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors space-y-2"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs font-medium text-zinc-200 leading-relaxed">
                  {remark.originalText}
                </p>
                <span className="text-[11px] font-mono text-zinc-400 bg-zinc-850 px-2 py-0.5 rounded whitespace-nowrap tabular-nums shrink-0">
                  {remark.rowIndices.length} row{remark.rowIndices.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Sample Row PKs */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 border-t border-zinc-850">
                <span className="truncate max-w-xs font-mono">
                  PK: {remark.rowIndices.slice(0, 3).map((idx) => String(allRows[idx]?.[primaryKeyCol] || idx)).join(', ')}
                  {remark.rowIndices.length > 3 ? '...' : ''}
                </span>

                {/* Move to another bucket selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">Reassign:</span>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        onMoveRemark(remark.hash, e.target.value);
                      }
                    }}
                    className="text-[11px] py-0.5 px-1.5 border border-zinc-800 rounded bg-zinc-900 text-zinc-300 cursor-pointer"
                  >
                    <option value="">Move to...</option>
                    {allBuckets
                      .filter((b) => b.id !== bucket.id)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {filteredRemarks.length === 0 && (
            <div className="text-center py-12 text-zinc-500 text-xs">
              No remarks found matching &quot;{searchTerm}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-300 bg-zinc-850 border border-zinc-750 rounded-lg hover:bg-zinc-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
